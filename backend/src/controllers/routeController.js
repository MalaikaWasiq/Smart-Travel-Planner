const httpError = require('../utils/httpError');
const { buildRoute } = require('../services/routeService');

async function createRoute(req, res, next) {
  try {
    const { destination, activities } = req.body;
    if (!destination || !Array.isArray(activities) || activities.length < 1) {
      throw httpError(400, 'Destination and a non-empty activities array are required');
    }
    const route = await buildRoute({ destination, activities });
    res.json({ route });
  } catch (error) {
    next(error);
  }
}

module.exports = { createRoute };
