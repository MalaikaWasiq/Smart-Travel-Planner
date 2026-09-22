const httpError = require('../utils/httpError');
const { calculateBudget } = require('../services/budgetService');

function calculate(req, res, next) {
  try {
    const { budget, days, itinerary = [], route, selectedHotel, hotelSuggestions = [] } = req.body;
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
      throw httpError(400, 'A positive budget is required');
    }
    res.json({ budgetBreakdown: calculateBudget({ budget, days, itinerary, route, selectedHotel, hotelSuggestions }) });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculate };
