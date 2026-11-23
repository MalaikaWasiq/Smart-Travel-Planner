const httpError = require('../utils/httpError');
const { calculateBudget } = require('../services/budgetService');

function calculate(req, res, next) {
  try {
    const { budget, days, itinerary = [], route, selectedHotel, hotelSuggestions = [] } = req.body;
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
      throw httpError(400, 'A positive budget is required');
    }
    const breakdown = calculateBudget({ budget, days, itinerary, route, selectedHotel, hotelSuggestions });
    if (req.user?.role !== 'admin') {
      delete breakdown.companyProfit;
      delete breakdown.safetyMargin;
      if (breakdown.allocation) {
        delete breakdown.allocation.companyProfit;
        delete breakdown.allocation.safetyMargin;
      }
    }
    res.json({ budgetBreakdown: breakdown });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculate };
