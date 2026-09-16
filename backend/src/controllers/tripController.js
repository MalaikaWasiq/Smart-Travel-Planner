const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { getWeather } = require('../services/weatherService');
const { generateItinerary } = require('../services/itineraryService');

function ensureDbReady(req) {
  if (req.app.locals.dbReady) return;
  const dbError = req.app.locals.dbError;
  const message = dbError
    ? `Database unavailable: ${dbError}`
    : 'Database is not configured. Set MONGODB_URI and restart the backend.';
  throw httpError(503, message);
}

async function generateTrip(req, res, next) {
  try {
    ensureDbReady(req);

    const { destination, days, budget, interests = [] } = req.body;

    if (!destination || !days || !budget) {
      throw httpError(400, 'Destination, days, and budget are required');
    }

    const normalizedDays = Math.min(Math.max(Number(days), 1), 14);
    const normalizedBudget = Number(budget);

    if (!Number.isFinite(normalizedBudget) || normalizedBudget <= 0) {
      throw httpError(400, 'Budget must be a positive number');
    }

    const weatherResult = await getWeather(destination, normalizedDays);
    const generated = generateItinerary({
      destination,
      days: normalizedDays,
      budget: normalizedBudget,
      interests,
      forecast: weatherResult.forecast,
    });

    const trip = await Trip.create({
      userId: req.user._id,
      destination: generated.cityName,
      days: normalizedDays,
      budget: normalizedBudget,
      interests,
      weather: weatherResult.weather,
      forecast: weatherResult.forecast,
      itinerary: generated.itinerary,
      budgetBreakdown: generated.budgetBreakdown,
    });

    res.status(201).json({ trip });
  } catch (error) {
    next(error);
  }
}

async function listTrips(req, res, next) {
  try {
    ensureDbReady(req);

    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ trips });
  } catch (error) {
    next(error);
  }
}

async function getTrip(req, res, next) {
  try {
    ensureDbReady(req);

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      throw httpError(404, 'Trip not found');
    }

    res.json({ trip });
  } catch (error) {
    next(error);
  }
}

async function deleteTrip(req, res, next) {
  try {
    ensureDbReady(req);

    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      throw httpError(404, 'Trip not found');
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { generateTrip, listTrips, getTrip, deleteTrip };
