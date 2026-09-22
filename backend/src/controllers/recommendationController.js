const httpError = require('../utils/httpError');
const { getAttractionsSafe } = require('../services/attractionService');
const { rankAttractions } = require('../services/recommendationService');

async function recommend(req, res, next) {
  try {
    const city = String(req.query.city || req.body.city || '').trim();
    if (!city) throw httpError(400, 'city is required');
    const interests = Array.isArray(req.body.interests)
      ? req.body.interests
      : String(req.query.interests || '').split(',').map((value) => value.trim()).filter(Boolean);
    const candidates = Array.isArray(req.body.candidates) && req.body.candidates.length
      ? req.body.candidates.slice(0, 50)
      : await getAttractionsSafe(city, interests, 20);
    if (!candidates.length) return res.json({ recommendations: [], modelVersion: 'no-candidates', fallbackUsed: true });
    const result = await rankAttractions({
      userId: req.user._id,
      candidates,
      interests,
      weather: req.body.weather,
      budget: Number(req.body.budget) || 0,
      topK: Math.min(Math.max(Number(req.body.topK) || 10, 1), 20),
    });
    res.json(result);
  } catch (error) { next(error); }
}

module.exports = { recommend };
