const httpError = require('../utils/httpError');
const { getAttractionsSafe } = require('../services/attractionService');

async function listAttractions(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) throw httpError(400, 'city is required');
    const interests = String(req.query.interests || '').split(',').map((value) => value.trim()).filter(Boolean);
    const attractions = await getAttractionsSafe(city, interests, Math.min(Math.max(Number(req.query.limit) || 10, 1), 20));
    res.json({ city, source: attractions.length ? 'Wikipedia/MediaWiki' : 'fallback-unavailable', attractions });
  } catch (error) { next(error); }
}

module.exports = { listAttractions };
