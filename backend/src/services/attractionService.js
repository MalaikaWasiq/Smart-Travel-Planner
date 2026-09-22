const getFetch = require('../utils/fetch');

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const DEFAULT_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const attractionCache = new Map();

const interestKeywords = {
  historic: ['fort', 'mosque', 'palace', 'monument', 'museum', 'heritage', 'tomb', 'shrine', 'old city'],
  history: ['fort', 'mosque', 'palace', 'monument', 'museum', 'heritage', 'tomb', 'shrine', 'old city'],
  food: ['food street', 'restaurant', 'bazaar', 'market', 'cuisine'],
  nature: ['park', 'lake', 'garden', 'valley', 'hill', 'mountain', 'beach', 'desert'],
  adventure: ['trail', 'mountain', 'valley', 'lake', 'ski', 'hiking', 'bridge'],
  shopping: ['bazaar', 'market', 'mall', 'street'],
  culture: ['museum', 'arts', 'cultural', 'heritage', 'gallery', 'festival'],
};

function normalizeInterest(interest) {
  return String(interest || '').toLowerCase().replace(/[^a-z]/g, '');
}

function keywordsForInterests(interests = []) {
  const keywords = new Set();
  for (const interest of interests) {
    const normalized = normalizeInterest(interest);
    for (const [key, values] of Object.entries(interestKeywords)) {
      if (normalized.includes(key)) values.forEach((value) => keywords.add(value));
    }
  }

  if (!keywords.size) {
    ['fort', 'museum', 'park', 'bazaar', 'heritage'].forEach((value) => keywords.add(value));
  }

  return Array.from(keywords).slice(0, 8);
}

function buildSearchTerms(destination, interests = []) {
  const city = String(destination || '').trim();
  const keywords = keywordsForInterests(interests);
  return [
    `${city} tourist attractions`,
    `${city} landmarks`,
    ...keywords.map((keyword) => `${city} ${keyword}`),
  ].filter(Boolean);
}

async function fetchWithTimeout(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchImpl = await getFetch();
    return await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SmartTravelPlanner/1.0 (student project)',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWikipedia(term, limit = 4) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: term,
    gsrlimit: String(limit),
    prop: 'pageimages|extracts|coordinates',
    exintro: '1',
    explaintext: '1',
    exsentences: '2',
    piprop: 'thumbnail',
    pithumbsize: '300',
    origin: '*',
  });

  const response = await fetchWithTimeout(`${WIKIPEDIA_API_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Wikipedia returned status ${response.status}`);

  const data = await response.json();
  return Object.values(data?.query?.pages || {}).map((page) => ({
    title: page.title,
    summary: page.extract || '',
    imageUrl: page.thumbnail?.source,
    wikipediaUrl: `https://en.wikipedia.org/?curid=${page.pageid}`,
    latitude: page.coordinates?.[0]?.lat,
    longitude: page.coordinates?.[0]?.lon,
  }));
}

function isRelevantAttraction(attraction, destination) {
  const haystack = `${attraction.title || ''} ${attraction.summary || ''}`.toLowerCase();
  const city = String(destination || '').trim().toLowerCase();
  if (!city) return true;

  return haystack.includes(city) || haystack.includes('pakistan');
}

async function getAttractions(destination, interests = [], limit = 8) {
  const cacheKey = `${String(destination).trim().toLowerCase()}|${interests.map(normalizeInterest).sort().join(',')}|${limit}`;
  const cached = attractionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const terms = buildSearchTerms(destination, interests);
  const seen = new Set();
  const attractions = [];

  for (const term of terms) {
    if (attractions.length >= limit) break;

    const results = await searchWikipedia(term);
    for (const attraction of results) {
      const key = attraction.title.toLowerCase();
      if (seen.has(key) || !isRelevantAttraction(attraction, destination)) continue;

      seen.add(key);
      attractions.push(attraction);
      if (attractions.length >= limit) break;
    }
  }

  attractionCache.set(cacheKey, { value: attractions, expiresAt: Date.now() + CACHE_TTL_MS });
  if (attractionCache.size > 100) attractionCache.delete(attractionCache.keys().next().value);
  return attractions;
}

async function getAttractionsSafe(destination, interests = [], limit = 8) {
  try {
    return await getAttractions(destination, interests, limit);
  } catch (error) {
    console.warn(`[attractions] Wikipedia lookup failed. Reason: ${error.message}`);
    return [];
  }
}

module.exports = { getAttractions, getAttractionsSafe };
