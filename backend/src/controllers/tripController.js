const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { buildPlan } = require('../services/tripPlanningService');
const { buildTripRoutes } = require('../services/routeService');
const { calculateBudget } = require('../services/budgetService');
const { syncTripAlerts } = require('../services/alertService');

function enrichTripCompletion(trip) {
  if (!trip) return trip;
  const now = new Date();
  let endDateStr = trip.endDate;
  if (!endDateStr && trip.startDate) {
    const sDate = new Date(trip.startDate);
    if (!isNaN(sDate.getTime())) {
      const eDate = new Date(sDate.getTime() + Math.max(0, (trip.days || 1) - 1) * 24 * 60 * 60 * 1000);
      endDateStr = eDate.toISOString().split('T')[0];
    }
  }

  const isEligibleStatus = ['Confirmed', 'In Progress', 'Upcoming'].includes(trip.status);
  let isPastEndDate = false;
  if (endDateStr) {
    const endOfDay = new Date(`${endDateStr}T23:59:59.999Z`);
    isPastEndDate = endOfDay <= now;
  }

  const isEligibleForCompletion = Boolean(
    isEligibleStatus &&
    isPastEndDate &&
    trip.status !== 'Completed' &&
    trip.status !== 'Not Completed' &&
    trip.status !== 'Cancelled'
  );

  trip.isEligibleForCompletion = isEligibleForCompletion;
  trip.computedEndDate = endDateStr;
  return trip;
}

function sanitizeTripForUser(tripDoc, role) {
  if (!tripDoc) return tripDoc;
  const trip = tripDoc.toObject ? tripDoc.toObject() : JSON.parse(JSON.stringify(tripDoc));
  enrichTripCompletion(trip);
  if (role === 'admin') return trip;

  // Protect internal company financial calculations, markups, and cost allocation trees from customers
  if (trip.budgetBreakdown) {
    delete trip.budgetBreakdown.companyProfit;
    delete trip.budgetBreakdown.safetyMargin;
    delete trip.budgetBreakdown.allocation;
  }
  delete trip.budgetAllocation;
  return trip;
}

function requireDatabase(req) {
  if (!req.app.locals.dbReady) throw httpError(503, 'Database is not configured');
}

function normalizeTripInput(input, current = {}) {
  const destination = String(input.destination ?? current.destination ?? '').trim();
  const days = Math.min(Math.max(Number(input.days ?? current.days), 1), 14);
  const interests = Array.isArray(input.interests ?? current.interests)
    ? (input.interests ?? current.interests).map((value) => String(value).trim()).filter(Boolean).slice(0, 15)
    : [];
  const travelType = ['Solo', 'Family', 'Group', 'Tour Company'].includes(input.travelType ?? current.travelType)
    ? (input.travelType ?? current.travelType)
    : 'Solo';
  const transportation = String(input.transportation ?? current.transportation ?? 'Private Car').trim();
  const comfortLevel = ['Basic', 'Normal', 'Luxury'].includes(input.comfortLevel ?? current.comfortLevel)
    ? (input.comfortLevel ?? current.comfortLevel)
    : 'Normal';
  const hotelRequired = input.hotelRequired !== undefined
    ? Boolean(input.hotelRequired)
    : (current.hotelRequired !== undefined ? Boolean(current.hotelRequired) : true);
  const selectedHotelId = input.selectedHotelId || current.selectedHotel?.id || undefined;
  const selectedRoomId = input.selectedRoomId || current.selectedHotel?.selectedRoom?.id || undefined;
  const startLocation = String(input.startLocation ?? current.startLocation ?? 'Islamabad').trim() || 'Islamabad';
  const startDate = String(input.startDate ?? current.startDate ?? new Date().toISOString().split('T')[0]).trim();
  const category = String(input.category ?? current.category ?? '').trim();

  let endDate = input.endDate ?? current.endDate;
  if (!endDate && startDate) {
    const sDate = new Date(startDate);
    if (!isNaN(sDate.getTime())) {
      const eDate = new Date(sDate.getTime() + Math.max(0, days - 1) * 24 * 60 * 60 * 1000);
      endDate = eDate.toISOString().split('T')[0];
    }
  }

  const numberOfPersons = Math.max(1, Number(input.numberOfPersons ?? current.numberOfPersons ?? 1));
  let budget = Number(input.budget ?? current.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    const pBudget = Number(input.budgetPerPerson ?? current.budgetPerPerson);
    if (Number.isFinite(pBudget) && pBudget > 0) {
      budget = pBudget * numberOfPersons;
    }
  }

  if (!destination) throw httpError(400, 'Destination is required');
  if (!Number.isFinite(days)) throw httpError(400, 'Days must be between 1 and 14');
  if (!Number.isFinite(budget) || budget <= 0) throw httpError(400, 'Budget must be a positive number');

  if (budget < 1000) {
    throw httpError(400, 'Budget must be at least PKR 1,000');
  }

  // Supervisor Rule: If budget is low (< PKR 3,500/person/day), the system should manage
  // the hotel stay and transport, while the customer handles food on their own.
  const isLowBudget = budget < (numberOfPersons * days * 3500);

  const budgetPerPerson = Number(input.budgetPerPerson ?? current.budgetPerPerson ?? 0) || Math.round(budget / numberOfPersons);
  const vehicleType = input.vehicleType || current.vehicleDetails?.id || undefined;
  const driverRequired = false; // Driver option removed
  const travelerGender = input.travelerGender || current.travelerGender || 'mixed';
  const maleCount = Number(input.maleCount ?? current.maleCount ?? 0);
  const femaleCount = Number(input.femaleCount ?? current.femaleCount ?? 0);
  const tripMode = ['customized', 'company'].includes(input.tripMode ?? current.tripMode)
    ? (input.tripMode ?? current.tripMode)
    : 'customized';
  const transportChoice = ['rental', 'own'].includes(input.transportChoice ?? current.transportChoice)
    ? (input.transportChoice ?? current.transportChoice)
    : 'rental';
  const preferredRoute = String(input.preferredRoute ?? current.preferredRoute ?? '').trim();

  // If budget is low, food is automatically self-arranged (handled by customer on their own)
  let foodChoice = isLowBudget ? 'self' : (
    ['included', 'self'].includes(input.foodChoice ?? current.foodChoice)
      ? (input.foodChoice ?? current.foodChoice)
      : 'included'
  );
  const transportRequired = input.transportRequired !== undefined ? Boolean(input.transportRequired) : (current.transportRequired !== undefined ? Boolean(current.transportRequired) : true);
  const foodRequired = isLowBudget ? false : (input.foodRequired !== undefined ? Boolean(input.foodRequired) : (current.foodRequired !== undefined ? Boolean(current.foodRequired) : true));
  const activitiesRequired = input.activitiesRequired !== undefined ? Boolean(input.activitiesRequired) : (current.activitiesRequired !== undefined ? Boolean(current.activitiesRequired) : true);

  // If 4 persons travel on a low budget, default rooms to 1 (Family Quad Room) to prevent stay cost from exceeding budget
  let defaultRooms = Math.max(1, Number(input.roomsQuantity ?? current.roomsQuantity ?? 1));
  if (isLowBudget && numberOfPersons <= 4 && !input.roomsQuantity) {
    defaultRooms = 1;
  }
  const roomsQuantity = defaultRooms;
  const selectedMeals = input.selectedMeals || current.selectedMeals || { breakfast: true, lunch: false, dinner: true };
  const optionalActivities = Array.isArray(input.optionalActivities ?? current.optionalActivities)
    ? (input.optionalActivities ?? current.optionalActivities)
    : [];
  const optionalExperiences = Array.isArray(input.optionalExperiences ?? current.optionalExperiences)
    ? (input.optionalExperiences ?? current.optionalExperiences)
    : [];

  return {
    destination,
    startLocation,
    startDate,
    endDate,
    category,
    days,
    budget,
    budgetPerPerson,
    numberOfPersons,
    travelerGender,
    maleCount,
    femaleCount,
    vehicleType,
    driverRequired,
    tripMode,
    transportChoice,
    preferredRoute,
    transportRequired,
    foodRequired,
    activitiesRequired,
    roomsQuantity,
    selectedMeals,
    foodChoice,
    optionalActivities,
    optionalExperiences,
    interests,
    travelType,
    transportation,
    comfortLevel,
    hotelRequired,
    selectedHotelId,
    selectedRoomId,
  };
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
    budgetPerPerson: trip.budgetPerPerson,
    numberOfPersons: trip.numberOfPersons || 1,
    days: trip.days,
    itinerary: trip.itinerary,
    route: trip.route,
    selectedHotel: trip.selectedHotel,
    hotelSuggestions: trip.hotelSuggestions,
    expenses: trip.expenses,
    vehicleType: trip.vehicleDetails?.id,
    driverRequired: false,
    tripMode: trip.tripMode,
    transportChoice: trip.transportChoice,
    foodChoice: trip.foodChoice,
    hotelRequired: trip.hotelRequired,
    transportRequired: trip.transportRequired,
    foodRequired: trip.foodRequired,
    activitiesRequired: trip.activitiesRequired,
    roomsQuantity: trip.roomsQuantity || 1,
    selectedMeals: trip.selectedMeals,
    selectedActivities: trip.optionalActivities,
    optionalExperiences: trip.optionalExperiences,
  });
  if (trip.budgetBreakdown?.packageDetails) {
    trip.packageDetails = trip.budgetBreakdown.packageDetails;
    trip.vehicleDetails = trip.budgetBreakdown.vehicleDetails;
    trip.foodPlan = trip.budgetBreakdown.foodPlan;
    trip.budgetAllocation = trip.budgetBreakdown.allocation;
  }
}

async function generateTrip(req, res, next) {
  try {
    requireDatabase(req);
    const input = normalizeTripInput(req.body);
    const userId = req.user?._id || undefined;
    const plan = await buildPlan({ ...input, userId });
    const trip = await Trip.create({ ...(userId ? { userId } : {}), ...plan });
    try {
      await syncTripAlerts(trip);
    } catch (alertError) {
      console.warn('[tripController] syncTripAlerts non-fatal error:', alertError.message);
    }
    res.status(201).json({ trip: sanitizeTripForUser(trip, req.user?.role) });
  } catch (error) {
    console.error('[tripController.generateTrip] ERROR:', error.stack || error.message);
    next(error);
  }
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role) });
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role) });
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role) });
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
    res.status(201).json({ trip: sanitizeTripForUser(trip, req.user?.role), expense: trip.expenses.at(-1) });
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role), expense });
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role), ok: true });
  } catch (error) { next(error); }
}

async function listTrips(req, res, next) {
  try {
    requireDatabase(req);
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ trips: trips.map((t) => sanitizeTripForUser(t, req.user?.role)) });
  } catch (error) { next(error); }
}

async function getTrip(req, res, next) {
  try {
    requireDatabase(req);
    let query;
    if (req.user?.role === 'admin') {
      // Admins have oversight to inspect any trip by ID
      query = { _id: req.params.id };
    } else if (req.user?._id) {
      // Authenticated users can view their own trips or guest-shared public trips
      query = {
        _id: req.params.id,
        $or: [{ userId: req.user._id }, { userId: null }, { userId: { $exists: false } }],
      };
    } else {
      // Guest visitors can only view unassigned / public trips, not private user trips
      query = {
        _id: req.params.id,
        $or: [{ userId: null }, { userId: { $exists: false } }],
      };
    }
    const trip = await Trip.findOne(query);
    if (!trip) throw httpError(404, 'Trip not found');
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role) });
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
    res.json({ trip: sanitizeTripForUser(trip, req.user?.role) });
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

async function verifyTripCompletion(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found or access denied');

    // Rule 3: Only trips with a valid confirmed/eligible trip record can enter completion verification.
    // Exclude cancelled trips and unconfirmed/pending trips.
    if (['Cancelled', 'Pending'].includes(trip.status)) {
      throw httpError(400, 'Cancelled or unconfirmed trips are not eligible for completion verification.');
    }

    // Rule 4: When the trip end date has passed
    const now = new Date();
    let endDateStr = trip.endDate;
    if (!endDateStr && trip.startDate) {
      const sDate = new Date(trip.startDate);
      if (!isNaN(sDate.getTime())) {
        const eDate = new Date(sDate.getTime() + Math.max(0, (trip.days || 1) - 1) * 24 * 60 * 60 * 1000);
        endDateStr = eDate.toISOString().split('T')[0];
      }
    }

    if (endDateStr) {
      const endOfDay = new Date(`${endDateStr}T23:59:59.999Z`);
      if (endOfDay > now) {
        throw httpError(400, `Completion verification is only available after the trip end date (${endDateStr}) has passed.`);
      }
    }

    const action = String(req.body.action || '').trim().toLowerCase();

    // Rule 6: If the user confirms completion ("Yes, I completed my trip.")
    if (action === 'completed' || action === 'yes') {
      trip.status = 'Completed';
      trip.completionStatus = 'completed';
      trip.completionConfirmedAt = new Date();
      trip.completionMethod = 'self_reported'; // Rule 10: self-reported completion, not independent/GPS verified
      trip.reviewEligible = true;
      await trip.save();
      return res.json({
        ok: true,
        trip: sanitizeTripForUser(trip, req.user?.role),
        message: `Trip to ${trip.destination} marked as completed. You can now rate your trip!`,
      });
    }

    // Rule 7: If the user says No ("No, I did not complete my trip.")
    if (action === 'not_completed' || action === 'no') {
      trip.status = 'Not Completed';
      trip.completionStatus = 'not_completed';
      trip.completionConfirmedAt = new Date();
      trip.completionMethod = 'self_reported';
      trip.reviewEligible = false;
      await trip.save();
      return res.json({
        ok: true,
        trip: sanitizeTripForUser(trip, req.user?.role),
        message: `Trip to ${trip.destination} marked as Not Completed.`,
      });
    }

    // Rule 8: If the user selects Remind me later
    if (action === 'remind_later' || action === 'later') {
      trip.completionStatus = 'remind_later';
      trip.remindCompletionAfter = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour snooze
      await trip.save();
      return res.json({
        ok: true,
        trip: sanitizeTripForUser(trip, req.user?.role),
        message: 'Reminder snoozed. You can complete verification anytime in My Trips.',
      });
    }

    throw httpError(400, 'Invalid action. Must be "completed", "not_completed", or "remind_later".');
  } catch (error) {
    next(error);
  }
}

async function submitTripReview(req, res, next) {
  try {
    requireDatabase(req);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) throw httpError(404, 'Trip not found or access denied');

    // Rule 9: Do not allow reviews for upcoming, cancelled, unconfirmed, or uncompleted trips.
    if (trip.status !== 'Completed' || !trip.reviewEligible) {
      throw httpError(403, 'Reviews can only be submitted for verified completed trips.');
    }

    // Rule 9: Prevent duplicate reviews
    if (trip.reviewSubmitted) {
      throw httpError(400, 'A review has already been submitted for this trip.');
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw httpError(400, 'Rating must be an integer between 1 and 5 stars.');
    }

    const comment = String(req.body.comment || '').trim().slice(0, 1000);

    trip.review = {
      rating,
      comment,
      submittedAt: new Date(),
    };
    trip.reviewSubmitted = true;
    await trip.save();

    res.json({
      ok: true,
      trip: sanitizeTripForUser(trip, req.user?.role),
      message: 'Thank you for rating your trip!',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateTrip, updateTrip, updateItinerary, listTrips, getTrip, selectHotel, deleteTrip,
  addExpense, updateExpense, deleteExpense, previewItineraryChange, refreshRoute,
  verifyTripCompletion, submitTripReview,
};
