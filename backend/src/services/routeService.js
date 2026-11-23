const getFetch = require('../utils/fetch');
const pakistanLandmarks = require('../data/pakistanLandmarks.json');
const pakistanDestinations = require('../data/pakistanDestinations.json');

const ORS_BASE_URL = process.env.OPENROUTESERVICE_BASE_URL || 'https://api.openrouteservice.org';
const DEFAULT_TIMEOUT_MS = 6000;
const PAKISTAN_BOUNDS = { minLongitude: 60.8, maxLongitude: 77.9, minLatitude: 23.4, maxLatitude: 37.2 };
const geocodeCache = new Map();
const destinationCache = new Map();

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

function normalizeKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractLandmarkName(place) {
  if (!place) return '';
  let clean = String(place)
    .replace(/^Highway drive from [^&]+&\s*/i, '')
    .replace(/^(Scenic excursion|Morning tour to|Guided tour of|Excursion to|Visit to):\s*/i, '')
    .replace(/^(Morning tour to|Excursion to|Visit to)\s+/i, '')
    .replace(/^(Lunch Break at|Dinner at|Breakfast at|Snacks at|Tea at)\s+/i, '')
    .replace(/^Sunset View & Photography at\s+/i, '')
    .replace(/^Hotel check-in & Dinner at\s+/i, '')
    .replace(/^Check-in & Dinner at\s+/i, '')
    .replace(/\s+with guided exploration.*$/i, '')
    .trim();
  return clean || place;
}

function lookupStaticCoordinates(name, destination = '') {
  if (!name) return null;
  const key = normalizeKey(name);
  if (!key) return null;

  // Direct match in landmarks or destinations
  if (pakistanLandmarks.landmarks[key]) return pakistanLandmarks.landmarks[key];
  if (pakistanLandmarks.destinations[key]) return pakistanLandmarks.destinations[key];

  // Try matching against destination data
  const destMatch = pakistanDestinations.find((d) => normalizeKey(d.name) === key || normalizeKey(d.destinationId) === key);
  if (destMatch && isInPakistan([destMatch.longitude, destMatch.latitude])) {
    return [Number(destMatch.longitude), Number(destMatch.latitude)];
  }

  // Partial match in landmarks
  for (const [k, coords] of Object.entries(pakistanLandmarks.landmarks)) {
    if ((key.length >= 4 && k.includes(key)) || (k.length >= 4 && key.includes(k))) {
      return coords;
    }
  }

  // Check destination aliases
  if (destination) {
    const destKey = normalizeKey(destination);
    if (pakistanLandmarks.destinations[destKey]) {
      // If landmark includes a known sub-area or word
      for (const [k, coords] of Object.entries(pakistanLandmarks.landmarks)) {
        if (key.includes(k)) return coords;
      }
    }
  }

  return null;
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
  const cleanDest = String(destination || '').trim();
  if (!cleanDest) return [74.65, 36.3167]; // Default Hunza
  const cacheKey = cleanDest.toLowerCase();
  if (destinationCache.has(cacheKey)) return destinationCache.get(cacheKey);

  // 1. Static lookup
  const staticCoords = lookupStaticCoordinates(cleanDest);
  if (staticCoords && isInPakistan(staticCoords)) {
    destinationCache.set(cacheKey, staticCoords);
    return staticCoords;
  }

  // 2. OpenRouteService
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        text: `${cleanDest}, Pakistan`,
        size: '5',
        'boundary.country': 'PK',
      });
      const response = await fetchWithTimeout(`${ORS_BASE_URL}/geocode/search?${params.toString()}`);
      if (response.ok) {
        const features = (await response.json())?.features || [];
        const found = features.map((f) => f?.geometry?.coordinates).find(isInPakistan);
        if (found) {
          destinationCache.set(cacheKey, found);
          return found;
        }
      }
    } catch (err) {
      console.warn(`[routeService] ORS destination geocode failed for ${cleanDest}: ${err.message}`);
    }
  }

  // 3. OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&limit=1&q=${encodeURIComponent(`${cleanDest}, Pakistan`)}`;
    const nomResp = await fetchWithTimeout(nomUrl, { headers: { 'User-Agent': 'SmartTravelPlanner/1.0' } });
    if (nomResp.ok) {
      const nomData = await nomResp.json();
      if (nomData?.[0]?.lat && nomData?.[0]?.lon) {
        const coords = [Number(nomData[0].lon), Number(nomData[0].lat)];
        if (isInPakistan(coords)) {
          destinationCache.set(cacheKey, coords);
          return coords;
        }
      }
    }
  } catch (err) {
    console.warn(`[routeService] Nominatim destination geocode failed for ${cleanDest}: ${err.message}`);
  }

  const fallback = [74.65, 36.3167];
  destinationCache.set(cacheKey, fallback);
  return fallback;
}

function deterministicOffset(str, index = 0) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const factor = (index % 4) + 1;
  const lonOffset = ((Math.sin(hash) * 10000) % 1) * 0.018 * factor;
  const latOffset = ((Math.cos(hash) * 10000) % 1) * 0.015 * factor;
  return [lonOffset, latOffset];
}

async function geocodePlace(place, destination, destinationCoordinates, activityIndex = 0) {
  const cleanLandmark = extractLandmarkName(place);
  const cacheKey = `${cleanLandmark}__${destination}`.toLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  // 1. Static Dictionary Lookup
  let coords = lookupStaticCoordinates(cleanLandmark, destination)
    || lookupStaticCoordinates(place, destination);
  if (coords && isInPakistan(coords)) {
    geocodeCache.set(cacheKey, coords);
    return coords;
  }

  // 2. OpenRouteService
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (apiKey) {
    try {
      const query = `${cleanLandmark}, ${destination}, Pakistan`;
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
      if (response.ok) {
        const features = (await response.json())?.features || [];
        const match = features.find((f) => isInPakistan(f?.geometry?.coordinates));
        if (match?.geometry?.coordinates) {
          const res = [Number(match.geometry.coordinates[0]), Number(match.geometry.coordinates[1])];
          geocodeCache.set(cacheKey, res);
          return res;
        }
      }
    } catch (err) {
      console.warn(`[routeService] ORS geocodePlace failed for ${cleanLandmark}: ${err.message}`);
    }
  }

  // 3. OpenStreetMap Nominatim Fallback
  try {
    const nomQuery = `${cleanLandmark}, ${destination}, Pakistan`;
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&limit=1&q=${encodeURIComponent(nomQuery)}`;
    const nomResp = await fetchWithTimeout(nomUrl, { headers: { 'User-Agent': 'SmartTravelPlanner/1.0' } });
    if (nomResp.ok) {
      const nomData = await nomResp.json();
      if (nomData?.[0]?.lat && nomData?.[0]?.lon) {
        const nomCoords = [Number(nomData[0].lon), Number(nomData[0].lat)];
        if (isInPakistan(nomCoords)) {
          geocodeCache.set(cacheKey, nomCoords);
          return nomCoords;
        }
      }
    }
  } catch (err) {
    console.warn(`[routeService] Nominatim geocodePlace failed for ${cleanLandmark}: ${err.message}`);
  }

  // 4. Deterministic Destination Cluster Offset (Never leave coordinates empty)
  if (destinationCoordinates && isInPakistan(destinationCoordinates)) {
    const [dLon, dLat] = deterministicOffset(cleanLandmark || place, activityIndex);
    const clusteredCoords = [
      Number((destinationCoordinates[0] + dLon).toFixed(6)),
      Number((destinationCoordinates[1] + dLat).toFixed(6)),
    ];
    if (isInPakistan(clusteredCoords)) {
      geocodeCache.set(cacheKey, clusteredCoords);
      return clusteredCoords;
    }
    return destinationCoordinates;
  }

  return [74.65, 36.3167];
}

async function coordinatesForActivities(activities, destination) {
  let destinationCoordinates = null;
  try {
    destinationCoordinates = await geocodeDestination(destination);
  } catch (error) {
    destinationCoordinates = [74.65, 36.3167];
  }

  const enriched = [];
  let index = 0;
  for (const activity of activities || []) {
    const sourceActivity = activity?.toObject ? activity.toObject() : activity;
    const existingLat = finiteCoordinate(sourceActivity.latitude);
    const existingLon = finiteCoordinate(sourceActivity.longitude);
    let coordinates = existingLat !== null && existingLon !== null ? [existingLon, existingLat] : null;

    if (!coordinates || !isInPakistan(coordinates)) {
      try {
        coordinates = await geocodePlace(sourceActivity.place, destination, destinationCoordinates, index);
      } catch (err) {
        coordinates = null;
      }
    }

    if (!coordinates || !isInPakistan(coordinates)) {
      coordinates = destinationCoordinates || [74.65, 36.3167];
    }

    const { latitude: ignoredLat, longitude: ignoredLon, ...rest } = sourceActivity;
    enriched.push({
      ...rest,
      longitude: coordinates[0],
      latitude: coordinates[1],
    });
    index += 1;
  }
  return enriched;
}

function generateInterpolatedRoute(waypoints) {
  const points = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const steps = 8;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      // Linear interpolation with a gentle road curve
      const jitter = Math.sin(t * Math.PI) * 0.003;
      const lon = start[0] + (end[0] - start[0]) * t + jitter;
      const lat = start[1] + (end[1] - start[1]) * t + jitter;
      points.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
    }
  }
  return points.length ? points : waypoints;
}

function estimatedRoute(activities) {
  const coordinates = activities
    .filter((a) => finiteCoordinate(a.longitude) !== null && finiteCoordinate(a.latitude) !== null)
    .map((a) => [Number(a.longitude), Number(a.latitude)]);

  let directMeters = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    directMeters += haversineMeters(coordinates[index - 1], coordinates[index]);
  }

  const estimatedDrivingMeters = Math.max(12000, Math.round(directMeters * 1.32));
  const estimatedDuration = Math.round(estimatedDrivingMeters / 11.1); // ~40 km/h avg in mountains

  const polylineCoords = coordinates.length >= 2 ? generateInterpolatedRoute(coordinates) : coordinates;

  return {
    status: 'estimated',
    distanceMeters: estimatedDrivingMeters,
    durationSeconds: estimatedDuration,
    coordinates: polylineCoords,
    activities,
    note: 'Scenic driving route connecting itinerary stops.',
  };
}

async function openRouteServiceRoute(activities) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  const waypoints = activities
    .filter((a) => finiteCoordinate(a.longitude) !== null && finiteCoordinate(a.latitude) !== null)
    .map((a) => [Number(a.longitude), Number(a.latitude)]);

  if (!apiKey || waypoints.length < 2) return null;

  try {
    const response = await fetchWithTimeout(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: waypoints }),
    }, 5000);

    if (!response.ok) return null;
    const feature = (await response.json())?.features?.[0];
    if (!feature?.geometry?.coordinates?.length) return null;

    return {
      status: 'live',
      distanceMeters: Math.round(feature.properties?.summary?.distance || 0),
      durationSeconds: Math.round(feature.properties?.summary?.duration || 0),
      coordinates: feature.geometry.coordinates,
      activities,
      note: 'Live road route calculated by OpenRouteService.',
    };
  } catch (err) {
    return null;
  }
}

async function osrmRoute(activities) {
  const waypoints = activities
    .filter((a) => finiteCoordinate(a.longitude) !== null && finiteCoordinate(a.latitude) !== null)
    .map((a) => [Number(a.longitude), Number(a.latitude)]);

  if (waypoints.length < 2) return null;

  try {
    const coordsStr = waypoints.map((w) => `${w[0]},${w[1]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'SmartTravelPlanner/1.0' } }, 5000);
    if (!response.ok) return null;

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return null;

    return {
      status: 'live',
      distanceMeters: Math.round(route.distance || 0),
      durationSeconds: Math.round(route.duration || 0),
      coordinates: route.geometry.coordinates,
      activities,
      note: 'Live turn-by-turn road route via OpenStreetMap.',
    };
  } catch (err) {
    return null;
  }
}

async function buildRoute({ destination, activities = [] }) {
  const enriched = await coordinatesForActivities(activities, destination);

  // 1. Try OpenRouteService
  try {
    const orsResult = await openRouteServiceRoute(enriched);
    if (orsResult && orsResult.coordinates?.length) return orsResult;
  } catch (err) {
    // Continue to OSRM
  }

  // 2. Try OSRM (Open Source Routing Machine on OpenStreetMap)
  try {
    const osrmResult = await osrmRoute(enriched);
    if (osrmResult && osrmResult.coordinates?.length) return osrmResult;
  } catch (err) {
    // Continue to estimated route
  }

  // 3. Fallback to resilient estimated route
  return estimatedRoute(enriched);
}

async function buildTripRoutes({ destination, itinerary = [] }) {
  const days = [];
  for (const day of itinerary) {
    const route = await buildRoute({ destination, activities: day.activities });
    days.push({ day: day.day, title: day.title, ...route });
  }

  const hasLive = days.some((day) => day.status === 'live');
  return {
    status: hasLive ? 'live' : 'estimated',
    provider: hasLive ? 'OpenStreetMap & OpenRouteService' : 'SmartTravelPlanner-Router',
    days,
    totalDistanceMeters: days.reduce((sum, day) => sum + (day.distanceMeters || 0), 0),
    totalDurationSeconds: days.reduce((sum, day) => sum + (day.durationSeconds || 0), 0),
  };
}

async function searchPakistaniCities(query) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  // Check static destinations first
  const staticMatches = pakistanDestinations
    .filter((d) => d.name.toLowerCase().includes(cleanQuery.toLowerCase()) || d.destinationId.includes(cleanQuery.toLowerCase()))
    .map((d) => ({
      id: `dest_${d.destinationId}`,
      destinationId: d.destinationId,
      name: d.name,
      label: `${d.name}, ${d.region}`,
      city: d.name,
      region: d.region,
      category: d.category,
      coordinates: [d.longitude, d.latitude],
      longitude: d.longitude,
      latitude: d.latitude,
      confidence: 0.95,
      source: 'Verified Pakistan Destinations',
      isMapLocation: true,
      description: d.description,
      imageUrl: d.imageUrl,
      rating: d.rating,
      featured: d.featured,
    }));

  if (staticMatches.length) return staticMatches.slice(0, 8);

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        text: `${cleanQuery}, Pakistan`,
        size: '8',
        'boundary.country': 'PK',
      });
      const response = await fetchWithTimeout(`${ORS_BASE_URL}/geocode/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const features = data?.features || [];
        return features
          .filter((f) => isInPakistan(f?.geometry?.coordinates))
          .map((f, idx) => {
            const props = f.properties || {};
            const coords = f.geometry.coordinates;
            const name = props.name || props.label || cleanQuery;
            const region = props.region || props.county || 'Pakistan';
            return {
              id: `map_${props.id || idx}_${Date.now()}`,
              destinationId: `map_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name,
              label: props.label || `${name}, ${region}`,
              city: props.locality || name,
              region,
              category: 'Adventure & Nature',
              coordinates: coords,
              longitude: coords[0],
              latitude: coords[1],
              confidence: props.confidence || 0.9,
              source: 'OpenRouteService Geocode (Live Map)',
              isMapLocation: true,
              description: `Discovered live from OpenStreetMap / OpenRouteService in ${region}, Pakistan.`,
              imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
              rating: 4.6,
              featured: false,
            };
          });
      }
    } catch (err) {
      console.warn(`[routeService] searchPakistaniCities failed: ${err.message}`);
    }
  }

  return [];
}

async function calculateRouteDistanceAndTolls(start, dest) {
  let startCoords = Array.isArray(start) ? start : null;
  let destCoords = Array.isArray(dest) ? dest : null;

  if (!startCoords && typeof start === 'string') {
    startCoords = await geocodeDestination(start).catch(() => null);
  }
  if (!destCoords && typeof dest === 'string') {
    destCoords = await geocodeDestination(dest).catch(() => null);
  }

  if (!startCoords || !destCoords) {
    return {
      status: 'estimated',
      distanceKm: 350,
      durationHours: 5,
      tollParkingCost: 1500,
      note: 'Default highway route estimate',
    };
  }

  // Try OSRM for quick highway driving calculation
  try {
    const coordsStr = `${startCoords[0]},${startCoords[1]};${destCoords[0]},${destCoords[1]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`;
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'SmartTravelPlanner/1.0' } }, 4000);
    if (response.ok) {
      const data = await response.json();
      const route = data?.routes?.[0];
      if (route?.distance) {
        const distanceKm = Math.round(route.distance / 1000);
        const durationHours = Math.round((route.duration / 3600) * 10) / 10;
        const tollParkingCost = Math.round(Math.max(500, distanceKm * 4.5));
        return {
          status: 'live',
          distanceKm,
          durationHours,
          tollParkingCost,
          note: 'Live OpenStreetMap highway driving computation',
        };
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  const meters = haversineMeters(startCoords, destCoords) * 1.3;
  const distanceKm = Math.round(meters / 1000);
  const durationHours = Math.round((distanceKm / 65) * 10) / 10;
  const tollParkingCost = Math.round(Math.max(500, distanceKm * 4.5));
  return {
    status: 'estimated',
    distanceKm,
    durationHours,
    tollParkingCost,
    note: 'Curved road geometry estimate',
  };
}

module.exports = {
  buildRoute,
  buildTripRoutes,
  haversineMeters,
  geocodeDestination,
  searchPakistaniCities,
  calculateRouteDistanceAndTolls,
};
