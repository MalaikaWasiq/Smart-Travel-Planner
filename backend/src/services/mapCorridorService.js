const getFetch = require('../utils/fetch');

const DEFAULT_TIMEOUT_MS = 6000;
const corridorMemoryCache = new Map();

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const fetchImpl = await getFetch();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'SmartTravelPlanner/1.0 (contact@travelplanner.pk)',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function geocodeLocation(nameOrCoords) {
  if (Array.isArray(nameOrCoords) && nameOrCoords.length === 2) {
    const lon = Number(nameOrCoords[0]);
    const lat = Number(nameOrCoords[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return { coordinates: [lon, lat], name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})` };
    }
  }

  const query = String(nameOrCoords || '').trim();
  if (!query) throw new Error('Missing location for geocoding');

  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&limit=1&q=${encodeURIComponent(query + ', Pakistan')}`;
  const data = await fetchJsonWithTimeout(url, {}, 5000);
  if (!Array.isArray(data) || !data[0] || !data[0].lat || !data[0].lon) {
    throw new Error(`Could not locate '${query}' on map`);
  }

  const lon = Number(data[0].lon);
  const lat = Number(data[0].lat);
  const displayName = data[0].display_name.split(',')[0].trim();
  return { coordinates: [lon, lat], name: displayName || query };
}

async function reverseGeocodeTown(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`;
    const data = await fetchJsonWithTimeout(url, {}, 4000);
    const addr = data?.address || {};
    return addr.city || addr.town || addr.county || addr.village || addr.municipality || data?.display_name?.split(',')?.[0]?.trim() || '';
  } catch (_) {
    return '';
  }
}

async function getWikipediaGeoPlaces(lat, lon, radiusMeters = 15000, limit = 4) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radiusMeters}&gslimit=${limit}&format=json`;
    const data = await fetchJsonWithTimeout(url, {}, 4000);
    const results = data?.query?.geosearch || [];
    return results.map((item) => ({
      name: item.title,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      distanceMeters: item.dist,
    }));
  } catch (_) {
    return [];
  }
}

async function discoverRouteCorridor(startInput, destInput) {
  const cacheKey = `${String(startInput)}__${String(destInput)}`.toLowerCase().trim();
  const cached = corridorMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < 7 * 24 * 3600 * 1000) {
    return cached.data;
  }

  // 1. Geocode Start & End dynamically via Nominatim
  const [startGeo, destGeo] = await Promise.all([
    geocodeLocation(startInput),
    geocodeLocation(destInput),
  ]);

  const startCoord = startGeo.coordinates;
  const destCoord = destGeo.coordinates;

  // 2. Fetch OSRM Highway Route Polyline & Steps
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoord[0]},${startCoord[1]};${destCoord[0]},${destCoord[1]}?steps=true&overview=full&geometries=geojson`;
  let routeData = null;
  try {
    routeData = await fetchJsonWithTimeout(osrmUrl, {}, 6000);
  } catch (err) {
    console.warn(`[mapCorridorService] OSRM primary route call failed: ${err.message}`);
  }

  const route = routeData?.routes?.[0];
  const totalDistanceKm = route ? Math.round(route.distance / 1000) : 0;
  const totalDurationHrs = route ? Number((route.duration / 3600).toFixed(1)) : 0;
  const polylineCoords = route?.geometry?.coordinates || [startCoord, destCoord];

  // Extract highway corridors traversed
  const roadSteps = route?.legs?.[0]?.steps || [];
  const highwaysTraversed = [...new Set(roadSteps.map((s) => s.name).filter(Boolean))];

  // 3. Sample Waypoints along Route Polyline
  const sampleRatios = [0.25, 0.50, 0.75];
  const sampleIndices = sampleRatios.map((r) => Math.floor(polylineCoords.length * r)).filter((idx) => idx > 0 && idx < polylineCoords.length - 1);

  const corridorWaypoints = [];

  // Add Start
  corridorWaypoints.push({
    name: startGeo.name,
    stage: 'departure',
    type: 'departure_city',
    latitude: startCoord[1],
    longitude: startCoord[0],
    distanceFromStartKm: 0,
  });

  // Query intermediate waypoints
  for (let i = 0; i < sampleIndices.length; i++) {
    const idx = sampleIndices[i];
    const [lon, lat] = polylineCoords[idx];
    const fraction = (idx / (polylineCoords.length - 1));
    const approxDist = Math.round(totalDistanceKm * fraction);

    const townName = await reverseGeocodeTown(lat, lon);
    const wikiPlaces = await getWikipediaGeoPlaces(lat, lon, 18000, 2);

    if (townName) {
      corridorWaypoints.push({
        name: townName,
        stage: 'transit',
        type: 'transit_stop',
        latitude: lat,
        longitude: lon,
        distanceFromStartKm: approxDist,
        nearbyPlaces: wikiPlaces.map((w) => w.name),
      });
    }
  }

  // Add Destination & Destination Area Highlights
  const destWikiPlaces = await getWikipediaGeoPlaces(destCoord[1], destCoord[0], 25000, 6);
  corridorWaypoints.push({
    name: destGeo.name,
    stage: 'destination',
    type: 'destination_center',
    latitude: destCoord[1],
    longitude: destCoord[0],
    distanceFromStartKm: totalDistanceKm,
    nearbyPlaces: destWikiPlaces.map((w) => w.name),
  });

  // Flatten destination notable places into real candidate stops
  const destinationCandidateStops = [
    {
      name: destGeo.name,
      type: 'destination_main',
      latitude: destCoord[1],
      longitude: destCoord[0],
    },
    ...destWikiPlaces.map((w) => ({
      name: w.name,
      type: 'natural_or_heritage_landmark',
      latitude: w.latitude,
      longitude: w.longitude,
    })),
  ];

  const result = {
    startLocation: startGeo.name,
    startCoordinates: startCoord,
    destination: destGeo.name,
    destinationCoordinates: destCoord,
    totalDistanceKm,
    totalDurationHrs,
    highwaysTraversed,
    corridorWaypoints,
    destinationCandidateStops,
    routePolyline: polylineCoords,
  };

  corridorMemoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

module.exports = {
  discoverRouteCorridor,
  geocodeLocation,
};
