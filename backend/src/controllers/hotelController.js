const httpError = require('../utils/httpError');
const { getHotelRecommendations } = require('../services/hotelService');

function listHotels(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) throw httpError(400, 'City is required');
    const hotels = getHotelRecommendations({
      city,
      budget: req.query.budget,
      days: req.query.days,
      limit: req.query.limit,
    });
    res.json({ hotels, priceType: 'estimate' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listHotels };
