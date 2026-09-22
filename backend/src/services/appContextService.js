const ChatSession = require('../models/ChatSession');
const Trip = require('../models/Trip');
const Alert = require('../models/Alert');
const Interaction = require('../models/Interaction');

const MAX_TRIP_HISTORY = 50;
const MAX_ALERTS = 20;
const MAX_INTERACTIONS = 30;
const MAX_RECENT_CHATS = 10;

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function compactActivity(activity) {
  return {
    time: String(activity?.time || 'Flexible').slice(0, 40),
    place: String(activity?.place || '').slice(0, 140),
    type: String(activity?.type || '').slice(0, 40),
    description: String(activity?.description || '').slice(0, 220),
    estimatedCost: asNumber(activity?.estimatedCost),
    ...(Number.isFinite(activity?.latitude) && Number.isFinite(activity?.longitude)
      ? { latitude: activity.latitude, longitude: activity.longitude }
      : {}),
  };
}

function compactHotel(hotel) {
  if (!hotel) return null;
  return {
    id: String(hotel.id || hotel._id || '').slice(0, 100),
    name: String(hotel.name || '').slice(0, 140),
    city: String(hotel.city || '').slice(0, 100),
    type: String(hotel.type || hotel.category || '').slice(0, 80),
    rating: asNumber(hotel.rating),
    pricePerNight: asNumber(hotel.pricePerNight),
    totalStayCost: asNumber(hotel.totalStayCost),
  };
}

function expenseTotals(expenses = []) {
  return expenses.reduce((totals, expense) => {
    const category = String(expense.category || 'misc');
    totals[category] = asNumber(totals[category]) + asNumber(expense.amount);
    totals.total = asNumber(totals.total) + asNumber(expense.amount);
    return totals;
  }, { total: 0 });
}

function compactTripHistory(trip) {
  const expenses = trip.expenses || [];
  return {
    id: String(trip._id),
    destination: trip.destination,
    days: asNumber(trip.days),
    interests: (trip.interests || []).slice(0, 10),
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    itinerarySource: trip.itinerarySource,
    plannedBudget: asNumber(trip.budget),
    estimatedSpend: asNumber(trip.budgetBreakdown?.totalEstimated),
    estimatedRemaining: asNumber(trip.budgetBreakdown?.remaining),
    actualSpend: asNumber(trip.budgetBreakdown?.actualSpent),
    actualRemaining: asNumber(trip.budgetBreakdown?.actualRemaining),
    overBudget: Boolean(trip.budgetBreakdown?.exceeded || trip.budgetBreakdown?.actualExceeded),
    expenseTotals: expenseTotals(expenses),
    selectedHotel: compactHotel(trip.selectedHotel),
    route: {
      status: trip.route?.status || 'unavailable',
      distanceKm: Math.round(asNumber(trip.route?.totalDistanceMeters) / 100) / 10,
      durationMinutes: Math.round(asNumber(trip.route?.totalDurationSeconds) / 60),
    },
  };
}

function compactActiveTrip(trip) {
  if (!trip) return null;
  const expenses = [...(trip.expenses || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    ...compactTripHistory(trip),
    weather: trip.weather || null,
    forecast: (trip.forecast || []).slice(0, 14),
    recommendationMetadata: trip.recommendationMetadata || null,
    budgetBreakdown: trip.budgetBreakdown || {},
    itinerary: (trip.itinerary || []).slice(0, 14).map((day) => ({
      day: day.day,
      title: String(day.title || '').slice(0, 120),
      weatherNote: String(day.weatherNote || '').slice(0, 300),
      activities: (day.activities || []).slice(0, 10).map(compactActivity),
    })),
    selectedHotel: compactHotel(trip.selectedHotel),
    recommendedHotels: (trip.hotelSuggestions || trip.hotels || []).slice(0, 8).map(compactHotel),
    route: {
      status: trip.route?.status || 'unavailable',
      provider: trip.route?.provider || 'unknown',
      totalDistanceKm: Math.round(asNumber(trip.route?.totalDistanceMeters) / 100) / 10,
      totalDurationMinutes: Math.round(asNumber(trip.route?.totalDurationSeconds) / 60),
      days: (trip.route?.days || []).slice(0, 14).map((day) => ({
        day: day.day,
        status: day.status,
        distanceKm: Math.round(asNumber(day.distanceMeters) / 100) / 10,
        durationMinutes: Math.round(asNumber(day.durationSeconds) / 60),
        mappedStops: (day.activities || []).filter((activity) => Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude)).length,
        totalStops: (day.activities || []).length,
      })),
    },
    expenses: expenses.slice(0, 30).map((expense) => ({
      category: expense.category,
      amount: asNumber(expense.amount),
      date: expense.date,
      day: expense.day,
      note: String(expense.note || '').slice(0, 180),
    })),
    expenseTotals: expenseTotals(expenses),
    attractions: (trip.attractions || []).slice(0, 12).map((attraction) => ({
      title: String(attraction.title || attraction.place || '').slice(0, 140),
      category: attraction.category,
      score: asNumber(attraction.score),
      reason: String(attraction.reason || '').slice(0, 220),
    })),
  };
}

function portfolioSummary(trips) {
  const history = trips.map(compactTripHistory);
  return {
    tripCount: history.length,
    totalPlannedDays: history.reduce((sum, trip) => sum + trip.days, 0),
    destinations: [...new Set(history.map((trip) => trip.destination).filter(Boolean))],
    totalPlannedBudgets: history.reduce((sum, trip) => sum + trip.plannedBudget, 0),
    totalEstimatedSpend: history.reduce((sum, trip) => sum + trip.estimatedSpend, 0),
    totalRecordedSpend: history.reduce((sum, trip) => sum + trip.actualSpend, 0),
    overBudgetTripCount: history.filter((trip) => trip.overBudget).length,
  };
}

async function buildAppContext({ user, activeTripId, currentSessionId }) {
  const userId = user._id;
  const includeInteractions = user.preferences?.dataConsent !== false;
  const [trips, alerts, interactions, recentChats] = await Promise.all([
    Trip.find({ userId }).sort({ createdAt: -1 }).limit(MAX_TRIP_HISTORY).lean(),
    Alert.find({ userId, active: true }).sort({ severity: -1, updatedAt: -1 }).limit(MAX_ALERTS).lean(),
    includeInteractions
      ? Interaction.find({ userId }).sort({ createdAt: -1 }).limit(MAX_INTERACTIONS).lean()
      : Promise.resolve([]),
    ChatSession.find({ userId, ...(currentSessionId ? { _id: { $ne: currentSessionId } } : {}) })
      .sort({ updatedAt: -1 }).limit(MAX_RECENT_CHATS).select('title tripId messages updatedAt').lean(),
  ]);

  const activeTrip = activeTripId
    ? trips.find((trip) => String(trip._id) === String(activeTripId)) || null
    : trips[0] || null;

  return {
    activeTrip,
    context: {
      generatedAt: new Date().toISOString(),
      accessMode: 'authenticated-read-only',
      dataCoverage: {
        savedTrips: trips.length,
        activeAlerts: alerts.length,
        recentInteractions: interactions.length,
        recentChats: recentChats.length,
        interactionHistoryEnabled: includeInteractions,
      },
      user: {
        fullName: user.fullName,
        preferences: user.preferences || {},
        memberSince: user.createdAt,
      },
      portfolio: portfolioSummary(trips),
      activeTrip: compactActiveTrip(activeTrip),
      tripHistory: trips.map(compactTripHistory),
      activeAlerts: alerts.map((alert) => ({
        tripId: String(alert.tripId),
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        read: alert.read,
        updatedAt: alert.updatedAt,
      })),
      recentInteractions: interactions.map((interaction) => ({
        tripId: interaction.tripId ? String(interaction.tripId) : null,
        eventType: interaction.eventType,
        itemType: interaction.itemType,
        itemId: interaction.itemId,
        value: interaction.value,
        createdAt: interaction.createdAt,
      })),
      recentChats: recentChats.map((chat) => ({
        title: chat.title,
        tripId: chat.tripId ? String(chat.tripId) : null,
        updatedAt: chat.updatedAt,
        lastMessage: String(chat.messages?.at(-1)?.content || '').slice(0, 240),
      })),
    },
  };
}

module.exports = { buildAppContext, compactActiveTrip, compactTripHistory, portfolioSummary };
