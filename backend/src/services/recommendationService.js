const getFetch = require('../utils/fetch');

const DEFAULT_TIMEOUT_MS = 3000;
const categoryTerms = {
  history: ['fort', 'mosque', 'monument', 'tomb', 'historic', 'heritage', 'ancient'],
  culture: ['museum', 'gallery', 'arts', 'cultural', 'shrine', 'village'],
  nature: ['park', 'lake', 'garden', 'valley', 'hill', 'mountain', 'beach', 'forest'],
  adventure: ['trail', 'hiking', 'ski', 'chair lift', 'desert', 'bridge', 'pass'],
  food: ['food', 'restaurant', 'cuisine', 'cafe'],
  shopping: ['bazaar', 'market', 'mall', 'shops'],
};

function categoryFor(attraction) {
  const text = `${attraction.title || ''} ${attraction.summary || ''}`.toLowerCase();
  const scores = Object.entries(categoryTerms).map(([category, terms]) => [category, terms.filter((term) => text.includes(term)).length]);
  scores.sort((left, right) => right[1] - left[1]);
  return scores[0][1] ? scores[0][0] : 'culture';
}

function deterministicRank({ candidates, interests = [], weather, budget, topK = 10 }) {
  const wanted = new Set(interests.map((value) => String(value).toLowerCase().replace(/[^a-z]/g, '')));
  const condition = String(weather?.main || weather?.description || '').toLowerCase();
  return candidates.map((candidate, index) => {
    const category = categoryFor(candidate);
    const interestScore = wanted.has(category) ? 1 : 0.2;
    const poorWeather = /rain|snow|storm/.test(condition);
    const weatherScore = poorWeather
      ? (['culture', 'food', 'shopping', 'history'].includes(category) ? 0.3 : -0.2)
      : (['nature', 'adventure'].includes(category) ? 0.15 : 0);
    const score = interestScore + weatherScore
      + (Number.isFinite(candidate.latitude) ? 0.08 : 0)
      + (budget ? 0.05 : 0)
      + (candidate.wikipediaUrl ? 0.05 : 0)
      + Math.max(0, 0.12 - index * 0.004);
    return {
      ...candidate,
      id: candidate.id || String(candidate.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category,
      score: Number(score.toFixed(6)),
      reason: `${category} content${wanted.has(category) ? '; matches your interests' : ''}${weatherScore > 0 ? '; fits expected weather' : ''}`,
      modelVersion: 'deterministic-content-v1.0.0',
      fallbackSource: 'node-content-rules',
    };
  }).sort((left, right) => right.score - left.score || left.title.localeCompare(right.title)).slice(0, topK);
}

async function rankAttractions({ userId, candidates, interests = [], weather, budget, topK = 10 }) {
  const serviceUrl = String(process.env.ML_SERVICE_URL || '').replace(/\/$/, '');
  if (!serviceUrl) {
    return { recommendations: deterministicRank({ candidates, interests, weather, budget, topK }), modelVersion: 'deterministic-content-v1.0.0', fallbackUsed: true };
  }
  const controller = new AbortController();
  const timeoutMs = Number(process.env.ML_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchImpl = await getFetch();
    const response = await fetchImpl(`${serviceUrl}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userId: userId ? String(userId) : undefined,
        candidates,
        interests,
        context: { weather: weather?.main || weather?.description, budget },
        topK,
      }),
    });
    if (!response.ok) throw new Error(`ML service returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.recommendations) || !data.recommendations.length) throw new Error('ML service returned no recommendations');
    return data;
  } catch (error) {
    console.warn(`[recommendations] ML service unavailable; using content fallback. Reason: ${error.message}`);
    return { recommendations: deterministicRank({ candidates, interests, weather, budget, topK }), modelVersion: 'deterministic-content-v1.0.0', fallbackUsed: true };
  } finally { clearTimeout(timeout); }
}

module.exports = { rankAttractions, deterministicRank, categoryFor };
