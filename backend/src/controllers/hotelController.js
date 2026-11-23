const httpError = require('../utils/httpError');
const { getHotelRecommendations, checkHotelAvailability } = require('../services/hotelService');

async function listHotels(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city || city.toLowerCase() === 'all') {
      const allHotels = require('../data/hotels.json');
      return res.json({ hotels: allHotels, total: allHotels.length, priceType: 'estimate' });
    }

    const hotels = await getHotelRecommendations({
      city,
      budget: req.query.budget,
      days: req.query.days,
      comfortLevel: req.query.comfortLevel,
      dailyHotelBudget: req.query.dailyHotelBudget,
      limit: req.query.limit,
      roomsQuantity: req.query.roomsQuantity || 1,
      numberOfPersons: req.query.numberOfPersons || 1,
    });

    res.json({ hotels, priceType: 'estimate' });
  } catch (error) {
    next(error);
  }
}

function verifyAvailability(req, res, next) {
  try {
    const { hotelId, roomId, days, budget, roomsQuantity } = req.body;
    if (!hotelId) throw httpError(400, 'hotelId is required');

    const result = checkHotelAvailability({
      hotelId,
      roomId,
      days: Number(days) || 1,
      budget: Number(budget) || 0,
      roomsQuantity: Number(roomsQuantity) || 1,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listHotels, verifyAvailability };
