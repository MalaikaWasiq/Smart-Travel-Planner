const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { buildPlan } = require('../services/tripPlanningService');
const { buildTripRoutes } = require('../services/routeService');
const { calculateBudget } = require('../services/budgetService');
const { syncTripAlerts } = require('../services/alertService');

function requireDatabase(req) {
  if (!req.app.locals.dbReady) throw httpError(503, 'Database is not configured');
}

function normalizeTripInput(input, current = {}) {
  const destination = String(input.destination ?? current.destination ?? '').trim();
  const days = Math.min(Math.max(Number(input.days ?? current.days), 1), 14);
  const budget = Number(input.budget ?? current.budget);
  const interests = Array.isArray(input.interests ?? current.interests)
    ? (input.interests ?? current.interests).map((value) => String(value).trim()).filter(Boolean).slice(0, 10)
    : [];
  if (!destination) throw httpError(400, 'Destination is required');
  if (!Number.isFinite(days)) throw httpError(400, 'Days must be between 1 and 14');
  if (!Number.isFinite(budget) || budget <= 0) throw httpError(400, 'Budget must be a positive number');
  return { destination, days, budget, interests };
}

function sanitizeItinerary(input, expectedDays) {
  if (!Array.isArray(input) || input.length !== expectedDays) {
    throw httpError(400, `Itinerary must contain exactly ${expectedDays} days`);
  }
  return input.map((day, dayIndex) => {
    if (!Array.isArray(day.activities) || day.activities.length < 1 || day.activities.length > 10) {
      throw httpError(400, `Day ${dayIndex + 1} must contain 1 to 10 activities`);
    }
    return {
      day: dayIndex + 1,
      title: String(day.title || `Day ${dayIndex + 1}`).trim().slice(0, 120),
      weatherNote: String(day.weatherNote || '').trim().slice(0, 300),
      activities: day.activities.map((activity, activityIndex) => {
        const cost = Number(activity.estimatedCost);
        if (!String(activity.place || '').trim() || !Number.isFinite(cost) || cost < 0) {
          throw httpError(400, `Day ${dayIndex + 1}, activity ${activityIndex + 1} has invalid place or cost`);
        }
        const latitude = Number(activity.latitude);
        const longitude = Number(activity.longitude);
        return {
          time: String(activity.time || 'Flexible').trim().slice(0, 40),
          place: String(activity.place).trim().slice(0, 140),
          type: String(activity.type || 'culture').trim().toLowerCase().slice(0, 40),
          description: String(activity.description || '').trim().slice(0, 600),
          estimatedCost: Math.round(cost),
          ...(Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : {}),
        };
      }),
    };
  });
}

function recalculateBudget(trip) {
  trip.budgetBreakdown = calculateBudget({
    budget: trip.budget,
    days: trip.days,
    itinerary: trip.itinerary,
    route: trip.route,
    selectedHotel: trip.selectedHotel,
    hotelSuggestions: trip.hotelSuggestions,
    expenses: trip.expenses,
  });
}

async function generateTrip(req, res, next) {
  try {
    requireDatabase(req);
    const input = normalizeTripInput(req.body);
    const plan = await buildPlan({ ...input, userId: req.user._id });
    const trip = await Trip.create({ userId: req.user._id, ...plan });
    await syncTripAlerts(trip);
    res.status(201).json({ trip });
  } catch (error) { next(error); }
}

async function updateTrip(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const input = normalizeTripInput(req.body, trip);
    const plan = await buildPlan({ ...input, expenses: trip.expenses, userId: req.user._id });
    Object.assign(trip, plan);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip });
  } catch (error) { next(error); }
}

async function updateItinerary(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const itinerary = sanitizeItinerary(req.body.itinerary, trip.days);
    const route = await buildTripRoutes({ destination: trip.destination, itinerary });
    trip.itinerary = itinerary.map((day, index) => ({ ...day, activities: route.days[index]?.activities || day.activities }));
    trip.route = route;
    trip.itinerarySource = 'user-edited';
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip });
  } catch (error) { next(error); }
}

async function previewItineraryChange(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    let candidate = req.body.itinerary;
    let changeSummary = 'Review itinerary changes before applying them.';
    if (!candidate) {
      const dayNumber = Number(req.body.day);
      const activityIndex = Number(req.body.activityIndex);
      const replacement = req.body.replacement;
      candidate = trip.itinerary.map((day) => day.toObject());
      const targetDay = candidate.find((day) => day.day === dayNumber);
      if (!targetDay || !Number.isInteger(activityIndex) || !targetDay.activities[activityIndex]) throw httpError(400, 'A valid day and activity index are required');
      if (!replacement?.place) throw httpError(400, 'Replacement activity is required');
      const previous = targetDay.activities[activityIndex];
      targetDay.activities[activityIndex] = { ...previous, ...replacement };
      changeSummary = `Replace ${previous.place} with ${replacement.place} on day ${dayNumber}.`;
    }
    const itinerary = sanitizeItinerary(candidate, trip.days);
    const route = await buildTripRoutes({ destination: trip.destination, itinerary });
    const routedItinerary = itinerary.map((day, index) => ({ ...day, activities: route.days[index]?.activities || day.activities }));
    const budgetBreakdown = calculateBudget({
      budget: trip.budget, days: trip.days, itinerary: routedItinerary, route,
      selectedHotel: trip.selectedHotel, hotelSuggestions: trip.hotelSuggestions, expenses: trip.expenses,
    });
    res.json({
      proposal: {
        summary: changeSummary,
        itinerary: routedItinerary,
        route,
        budgetBreakdown,
        impact: {
          estimatedCostDifference: Number(budgetBreakdown.totalEstimated || 0) - Number(trip.budgetBreakdown?.totalEstimated || 0),
          distanceDifferenceMeters: Number(route.totalDistanceMeters || 0) - Number(trip.route?.totalDistanceMeters || 0),
        },
      },
    });
  } catch (error) { next(error); }
}

async function selectHotel(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const hotelId = String(req.body.hotelId || '').trim();
    const selectedHotel = trip.hotelSuggestions.find((hotel) => hotel.id === hotelId);
    if (!selectedHotel) throw httpError(400, 'Hotel is not one of this trip\'s recommendations');
    trip.selectedHotel = selectedHotel.toObject ? selectedHotel.toObject() : selectedHotel;
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip });
  } catch (error) { next(error); }
}

async function addExpense(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const amount = Number(req.body.amount);
    const category = String(req.body.category || '').toLowerCase();
    if (!['hotels', 'food', 'transport', 'activities', 'misc'].includes(category)) throw httpError(400, 'Invalid expense category');
    if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Expense amount must be positive');
    const day = req.body.day === undefined || req.body.day === null ? undefined : Number(req.body.day);
    if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > trip.days)) throw httpError(400, 'Expense day is outside this trip');
    trip.expenses.push({ category, amount, date: req.body.date || new Date(), note: req.body.note, day });
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.status(201).json({ trip, expense: trip.expenses.at(-1) });
  } catch (error) { next(error); }
}

async function updateExpense(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const expense = trip.expenses.id(req.params.expenseId);
    if (!expense) throw httpError(404, 'Expense not found');
    if (req.body.category !== undefined) {
      const category = String(req.body.category).toLowerCase();
      if (!['hotels', 'food', 'transport', 'activities', 'misc'].includes(category)) throw httpError(400, 'Invalid expense category');
      expense.category = category;
    }
    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Expense amount must be positive');
      expense.amount = amount;
    }
    if (req.body.note !== undefined) expense.note = String(req.body.note).slice(0, 240);
    if (req.body.date !== undefined) expense.date = req.body.date;
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip, expense });
  } catch (error) { next(error); }
}

async function deleteExpense(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    const expense = trip.expenses.id(req.params.expenseId);
    if (!expense) throw httpError(404, 'Expense not found');
    expense.deleteOne();
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip, ok: true });
  } catch (error) { next(error); }
}

async function listTrips(req, res, next) {
  try { requireDatabase(req); res.json({ trips: await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50) }); }
  catch (error) { next(error); }
}

async function getTrip(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    res.json({ trip });
  } catch (error) { next(error); }
}

async function refreshRoute(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    if (!trip.itinerary?.length) throw httpError(400, 'Trip has no itinerary to route');

    const route = await buildTripRoutes({ destination: trip.destination, itinerary: trip.itinerary });
    trip.itinerary = trip.itinerary.map((day, index) => ({
      ...(day.toObject ? day.toObject() : day),
      activities: route.days[index]?.activities || day.activities,
    }));
    trip.route = route;
    trip.markModified('itinerary');
    trip.markModified('route');
    recalculateBudget(trip);
    await trip.save();
    await syncTripAlerts(trip);
    res.json({ trip });
  } catch (error) { next(error); }
}

async function deleteTrip(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found');
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = {
  generateTrip, updateTrip, updateItinerary, listTrips, getTrip, selectHotel, deleteTrip,
  addExpense, updateExpense, deleteExpense, previewItineraryChange, refreshRoute,
};
