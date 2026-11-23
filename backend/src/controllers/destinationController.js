const destinationService = require('../services/destinationService');
const { searchPakistaniCities } = require('../services/routeService');
const httpError = require('../utils/httpError');

const CATEGORIES = [
  'Cultural & Historical',
  'Northern Areas',
  'Adventure & Nature',
  'Coastal Areas',
];

async function listDestinations(req, res, next) {
  try {
    const { category, search } = req.query;
    const userId = req.user?.id || req.user?._id;

    const destinations = await destinationService.getDestinations({
      category,
      search,
      userId,
    });

    res.json({
      destinations,
      categories: CATEGORIES,
      total: destinations.length,
    });
  } catch (error) {
    next(error);
  }
}

async function getDestination(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    const destination = await destinationService.getDestinationById(id, userId);
    if (!destination) {
      throw httpError(404, 'Destination not found');
    }

    res.json({ destination });
  } catch (error) {
    next(error);
  }
}

async function toggleFavoriteDestination(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      throw httpError(401, 'Please sign in to save favorites');
    }

    const result = await destinationService.toggleFavorite(userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function listFavorites(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      throw httpError(401, 'Please sign in to view favorites');
    }

    const favorites = await destinationService.getUserFavorites(userId);
    res.json({ favorites, total: favorites.length });
  } catch (error) {
    next(error);
  }
}

async function searchMapDestinations(req, res, next) {
  try {
    const query = req.query.q || req.query.query || req.query.search || '';
    if (!query.trim()) {
      return res.json({ destinations: [], results: [] });
    }
    const results = await searchPakistaniCities(query.trim());
    res.json({
      destinations: results,
      results,
      query: query.trim(),
      total: results.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDestinations,
  getDestination,
  toggleFavoriteDestination,
  listFavorites,
  searchMapDestinations,
  CATEGORIES,
};
