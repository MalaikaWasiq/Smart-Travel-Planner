const getFetch = require('../utils/fetch');

const ORS_BASE_URL = process.env.OPENROUTESERVICE_BASE_URL || 'https://api.openrouteservice.org';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_DESTINATION_DISTANCE_METERS = 250000;
const PAKISTAN_BOUNDS = { minLongitude: 60.8, maxLongitude: 77.9, minLatitude: 23.4, maxLatitude: 37.2 };
const geocodeCache = new Map();
const destinationCache = new Map();
const GENERIC_PLACE_WORDS = new Set([
  'and', 'the', 'for', 'with', 'near', 'road', 'street', 'avenue', 'restaurant', 'restaurants',
  'cafe', 'hotel', 'market', 'center', 'centre', 'area', 'town', 'pakistan',
]);

function finiteCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function haversineMeters(from, to) {
  const radius = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to[1] - from[1]);
  const deltaLon = toRadians(to[0] - from[0]);
  const lat1 = toRadians(from[1]);
  const lat2 = toRadians(to[1]);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isInPakistan(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [longitude, latitude] = coordinates.map(Number);
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && longitude >= PAKISTAN_BOUNDS.minLongitude && longitude <= PAKISTAN_BOUNDS.maxLongitude
    && latitude >= PAKISTAN_BOUNDS.minLatitude && latitude <= PAKISTAN_BOUNDS.maxLatitude;
}

function meaningfulTokens(value, destination = '') {
  const destinationTokens = new Set(String(destination).toLowerCase().match(/[a-z0-9]+/g) || []);
  return (String(value).toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((token) => token.length >= 3 && !GENERIC_PLACE_WORDS.has(token) && !destinationTokens.has(token));
}

function featureMatchesPlace(feature, place, destination) {
  const requested = meaningfulTokens(place, destination);
  if (!requested.length) return true;
  const candidate = new Set(meaningfulTokens(feature?.properties?.name || feature?.properties?.label || '', destination));
  const matches = requested.filter((token) => candidate.has(token)).length;
  return matches >= Math.min(2, requested.length);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchImpl = await getFetch();
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeDestination(destination) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) return null;

  const cacheKey = String(destination).trim().toLowerCase();
  if (destinationCache.has(cacheKey)) return destinationCache.get(cacheKey);
  const params = new URLSearchParams({
    api_key: apiKey,
    text: `${destination}, Pakistan`,
    size: '5',
    'boundary.country': 'PK',
  });
  const response = await fetchWithTimeout(`${ORS_BASE_URL}/geocode/search?${params.toString()}`);
  if (!response.ok) throw new Error(`OpenRouteService destination geocoding returned ${response.status}`);
  const features = (await response.json())?.features || [];
  const coordinates = features.map((feature) => feature?.geometry?.coordinates).find(isInPakistan) || null;
  destinationCache.set(cacheKey, coordinates);
  return coordinates;
}

async function geocodePlace(place, destination, destinationCoordinates) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) return null;

  const query = `${place}, ${destination}, Pakistan`;
  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  const params = new URLSearchParams({
    api_key: apiKey,
    text: query,
    size: '5',
    'boundary.country': 'PK',
  });
  if (destinationCoordinates) {
    params.set('focus.point.lon', String(destinationCoordinates[0]));
    params.set('focus.point.lat', String(destinationCoordinates[1]));
  }
  const response = await fetchWithTimeout(`${ORS_BASE_URL}/geocode/search?${params.toString()}`);
  if (!response.ok) throw new Error(`OpenRouteService geocoding returned ${response.status}`);
  const features = (await response.json())?.features || [];
  const match = features.find((feature) => {
    const coordinates = feature?.geometry?.coordinates;
    return isInPakistan(coordinates)
      && (!destinationCoordinates || haversineMeters(destinationCoordinates, coordinates) <= MAX_DESTINATION_DISTANCE_METERS)
      && featureMatchesPlace(feature, place, destination);
  });
  const coordinates = match?.geometry?.coordinates;
  const result = coordinates ? [Number(coordinates[0]), Number(coordinates[1])] : null;
  geocodeCache.set(cacheKey, result);
  return result;
}

async function coordinatesForActivities(activities, destination) {
  let destinationCoordinates = null;
  try {
    destinationCoordinates = await geocodeDestination(destination);
  } catch (error) {
    console.warn(`[routes] Could not geocode destination ${destination}. Reason: ${error.message}`);
  }
  const enriched = [];
  for (const activity of activities || []) {
    const sourceActivity = activity?.toObject ? activity.toObject() : activity;
    const latitude = finiteCoordinate(sourceActivity.latitude);
    const longitude = finiteCoordinate(sourceActivity.longitude);
    let coordinates = latitude !== null && longitude !== null ? [longitude, latitude] : null;
    if (coordinates && (!isInPakistan(coordinates)
      || (destinationCoordinates && haversineMeters(destinationCoordinates, coordinates) > MAX_DESTINATION_DISTANCE_METERS))) {
      coordinates = null;
    }

    if (!coordinates) {
      try {
        coordinates = await geocodePlace(sourceActivity.place, destination, destinationCoordinates);
      } catch (error) {
        console.warn(`[routes] Could not geocode ${sourceActivity.place}. Reason: ${error.message}`);
      }
    }

    const { latitude: ignoredLatitude, longitude: ignoredLongitude, ...activityWithoutCoordinates } = sourceActivity;
    enriched.push({
      ...activityWithoutCoordinates,
      ...(coordinates ? { longitude: coordinates[0], latitude: coordinates[1] } : {}),
    });
  }
  return enriched;
}

function estimatedRoute(activities) {
  const coordinates = activities
    .filter((activity) => finiteCoordinate(activity.longitude) !== null && finiteCoordinate(activity.latitude) !== null)
    .map((activity) => [Number(activity.longitude), Number(activity.latitude)]);

  let distanceMeters = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    distanceMeters += haversineMeters(coordinates[index - 1], coordinates[index]);
  }

  const estimatedDrivingMeters = Math.round(distanceMeters * 1.25);
  return {
    status: coordinates.length >= 2 ? 'estimated' : 'unavailable',
    distanceMeters: estimatedDrivingMeters,
    durationSeconds: estimatedDrivingMeters ? Math.round(estimatedDrivingMeters / 8.33) : 0,
    coordinates,
    activities,
    note: coordinates.length >= 2
      ? 'Straight-line coordinates adjusted for an estimated road distance.'
      : 'Not enough geocoded activities to draw a route.',
  };
}

async function openRouteServiceRoute(activities) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  const waypoints = activities
    .filter((activity) => finiteCoordinate(activity.longitude) !== null && finiteCoordinate(activity.latitude) !== null)
    .map((activity) => [Number(activity.longitude), Number(activity.latitude)]);

  if (!apiKey || waypoints.length < 2) return null;
  const response = await fetchWithTimeout(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: waypoints }),
  });
  if (!response.ok) throw new Error(`OpenRouteService directions returned ${response.status}`);

  const feature = (await response.json())?.features?.[0];
  if (!feature?.geometry?.coordinates) throw new Error('OpenRouteService returned no route geometry');
  return {
    status: 'live',
    distanceMeters: Math.round(feature.properties?.summary?.distance || 0),
    durationSeconds: Math.round(feature.properties?.summary?.duration || 0),
    coordinates: feature.geometry.coordinates,
    activities,
    note: 'Driving route supplied by OpenRouteService.',
  };
}

async function buildRoute({ destination, activities = [] }) {
  const enriched = await coordinatesForActivities(activities, destination);
  try {
    return (await openRouteServiceRoute(enriched)) || estimatedRoute(enriched);
  } catch (error) {
    console.warn(`[routes] OpenRouteService failed; using estimate. Reason: ${error.message}`);
    return estimatedRoute(enriched);
  }
}

async function buildTripRoutes({ destination, itinerary = [] }) {
  const days = [];
  for (const day of itinerary) {
    const route = await buildRoute({ destination, activities: day.activities });
    days.push({ day: day.day, title: day.title, ...route });
  }

  return {
    status: days.some((day) => day.status === 'live')
      ? 'live'
      : days.some((day) => day.status === 'estimated') ? 'estimated' : 'unavailable',
    provider: process.env.OPENROUTESERVICE_API_KEY ? 'OpenRouteService' : 'local-estimate',
    days,
    totalDistanceMeters: days.reduce((sum, day) => sum + day.distanceMeters, 0),
    totalDurationSeconds: days.reduce((sum, day) => sum + day.durationSeconds, 0),
  };
}

module.exports = { buildRoute, buildTripRoutes, haversineMeters };
