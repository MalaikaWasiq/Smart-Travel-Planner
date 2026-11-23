const Alert = require('../models/Alert');

function detectHazards({ destination, weather, forecast = [], route = {} }) {
  const hazards = [];
  const destName = String(destination || '').toLowerCase();

  const heavyRainDay = forecast.find((f) => /heavy rain|torrential|thunderstorm|cloudburst|rain/i.test(`${f.main || ''} ${f.description || ''}`));

  // 1. LANDSLIDE & ROCKFALL HAZARD
  // Mountain valleys across Gilgit-Baltistan, KPK, Azad Kashmir, and Murree Hills
  const mountainousCities = [
    'hunza', 'skardu', 'gilgit', 'fairy meadows', 'murree', 'naran', 'kaghan',
    'swat', 'kalam', 'babusar', 'neelum', 'chitral', 'astore', 'malam jabba',
    'dir', 'kumrat', 'kohistan', 'rawalakot', 'abbottabad', 'muzaffarabad'
  ];
  const isMountainous = mountainousCities.some((c) => destName.includes(c));

  if (isMountainous) {
    if (heavyRainDay || forecast.some((f) => f.isRainy || f.isSnowy)) {
      hazards.push({
        type: 'landslide',
        severity: 'danger',
        title: 'Critical Landslide Risk in Mountain Passes',
        message: '⚠️ High landslide & rockfall alert on mountain access corridors (KKH, Kohistan, Swat-Kalam & Neelum Valley roads). Precipitation and snowmelt trigger sudden slope slides.',
        recommendedAction: 'Verify road clearance with FWO (051-9271616) and NHMP (130) before departure. Strictly travel in daylight hours (07:00 AM - 05:00 PM).',
      });
    } else {
      hazards.push({
        type: 'landslide',
        severity: 'warning',
        title: 'Mountain Pass Rockfall & Landslide Caution',
        message: '⚠️ Active rockfall and shooting-stone sectors along Karakoram Highway, Jaglot-Skardu road, and valley passes. Loose mountain gravel can cause temporary blockages.',
        recommendedAction: 'Avoid stopping vehicles under unstable rock cliffs. Maintain safe following distance and monitor local traffic police updates.',
      });
    }
  }

  // 2. SNOWFALL, SUB-ZERO & BLACK ICE HAZARD
  const snowProneCities = [
    'hunza', 'skardu', 'babusar', 'khunjerab', 'fairy meadows', 'malam jabba',
    'kalam', 'ziarat', 'murree', 'galyat', 'naran', 'kaghan', 'neelum', 'astore', 'deosai', 'chitral'
  ];
  const isSnowProne = snowProneCities.some((c) => destName.includes(c));
  const isFreezing = (weather?.temp !== undefined && weather.temp <= 6) || forecast.some((f) => f.isSnowy || f.temp <= 4);

  if (isSnowProne && isFreezing) {
    hazards.push({
      type: 'snow-ice',
      severity: weather?.temp <= 0 ? 'danger' : 'warning',
      title: 'Snowfall & Invisible Black Ice on Roads',
      message: '❄️ Sub-zero night temperatures cause invisible black ice on hairpin curves and high bridges. Extreme slippery road conditions.',
      recommendedAction: 'Use 4x4 vehicles with tire chains. Keep engine antifreeze topped up, verify heater functionality, and carry warm blankets.',
    });
  }

  // 3. SEASONAL PASS CLOSURES
  if (destName.includes('babusar') || destName.includes('deosai') || destName.includes('khunjerab')) {
    hazards.push({
      type: 'pass-closure',
      severity: 'warning',
      title: 'High-Altitude Pass Access Restriction',
      message: '🏔️ High altitude pass (>4,000m). Seasonal snow blockages can close transit outside peak summer (November to May).',
      recommendedAction: 'Confirm with local DC office or take alternative all-weather Karakoram Highway (KKH) route via Kohistan.',
    });
  }

  // 4. HEAVY RAINFALL & FLASH FLOOD HAZARD
  if (heavyRainDay) {
    hazards.push({
      type: 'heavy-rain',
      severity: 'danger',
      title: 'Heavy Rainfall & Flash Flood Hazard',
      message: '🌊 Severe rainfall/torrential cloudburst conditions can trigger sudden river surges and wash out low-lying bridges.',
      recommendedAction: 'Stay at least 100 meters away from riverbanks. Never attempt to drive across overflowing stream causeways.',
    });
  }

  // 5. DENSE FOG & SMOG HAZARD
  const isPlains = ['lahore', 'multan', 'faisalabad', 'sialkot', 'gujranwala', 'bahawalpur', 'sukkur'].some((c) => destName.includes(c));
  const isFog = (weather?.humidity > 80 && weather?.wind < 4) || /fog|mist|dense fog/i.test(`${weather?.description || ''}`);
  const isSmog = /smog|smoke|poor air/i.test(`${weather?.description || ''}`) || (isPlains && weather?.humidity > 60);

  if (isFog || isSmog) {
    hazards.push({
      type: isSmog ? 'smog' : 'fog',
      severity: 'warning',
      title: isSmog ? 'Toxic Smog & Highway Visibility Alert' : 'Dense Fog & Low Visibility Alert',
      message: '🌫️ Smog/fog causes visibility to drop below 30 meters on Motorways (M-2, M-3, M-4, M-5, M-9) during late nights and early mornings.',
      recommendedAction: 'Travel between 11:00 AM and 04:30 PM only. Turn on low-beam fog lights and dial Motorway Police Helpline (130) before departure.',
    });
  }

  // 6. COASTAL SEA SWELLS & ISOLATED HIGHWAY STRETCH
  const isCoastal = ['karachi', 'gwadar', 'kund malir', 'ormara', 'astola'].some((c) => destName.includes(c));
  if (isCoastal) {
    hazards.push({
      type: 'coastal',
      severity: 'warning',
      title: 'Coastal Swells & Remote Highway Stretch',
      message: '🌊 Strong rip currents on beaches. Makran Coastal Highway features 120km+ isolated stretches without fuel stations.',
      recommendedAction: 'Refuel at main towns, carry 10L reserve water per vehicle, and strictly obey red-flag swimming bans.',
    });
  }

  // 7. ROAD CLOSURE OR ROUTE PROBLEMS
  if (route?.status === 'unavailable' || route?.hasRoadClosure) {
    hazards.push({
      type: 'road-closure',
      severity: 'danger',
      title: 'Road Closure / Blockage Alert',
      message: '⚠️ Route section temporarily obstructed or closed for maintenance.',
      recommendedAction: 'Consult NHMP (130) or use local bypass routes.',
    });
  }

  // Smart Recommendation Engine
  let smartRecommendation = null;
  const criticalHazard = hazards.find((h) => h.severity === 'danger');
  if (criticalHazard) {
    smartRecommendation = {
      level: 'severe',
      headline: 'Consider planning your trip for another day.',
      reason: criticalHazard.message,
      suggestedAction: criticalHazard.recommendedAction,
      alternativeRouteAvailable: true,
      canChangeDates: true,
    };
  } else if (hazards.length) {
    smartRecommendation = {
      level: 'caution',
      headline: 'Travel with Caution.',
      reason: hazards[0].message,
      suggestedAction: hazards[0].recommendedAction,
      alternativeRouteAvailable: false,
      canChangeDates: false,
    };
  } else {
    smartRecommendation = {
      level: 'normal',
      headline: 'Normal Travel Conditions.',
      reason: 'No critical weather or road hazards currently reported along the route.',
      suggestedAction: 'Drive safely and adhere to national highway regulations.',
    };
  }

  const hasAlerts = hazards.length > 0;
  const severity = criticalHazard ? 'high' : (hasAlerts ? 'moderate' : 'low');
  const summary = smartRecommendation.reason || smartRecommendation.headline;
  const recommendation = `${smartRecommendation.headline} ${smartRecommendation.suggestedAction}`;
  const alerts = hazards.map((h) => ({
    hazard: h.type,
    title: h.title,
    message: h.message,
    severity: h.severity,
  }));

  return {
    hasAlerts,
    severity,
    summary,
    recommendation,
    alerts,
    hazards,
    smartRecommendation,
    safetyVerified: true,
    disclaimer: 'Verify real-time highway conditions with National Highways & Motorway Police (130) prior to departure.',
  };
}

async function syncTripAlerts(trip) {
  if (!trip?._id || !trip.userId) return [];
  const alerts = [];

  const hazardAnalysis = detectHazards({
    destination: trip.destination,
    weather: trip.weather,
    forecast: trip.forecast,
    route: trip.route,
  });

  // Attach detected hazards
  for (const hazard of hazardAnalysis.hazards) {
    alerts.push({
      dedupeKey: `trip:${trip._id}:hazard:${hazard.type}`,
      type: 'safety',
      severity: hazard.severity,
      title: hazard.title,
      message: hazard.message,
      recommendedAction: hazard.recommendedAction,
    });
  }

  // Budget alerts
  if (trip.budgetBreakdown?.exceeded) {
    alerts.push({
      dedupeKey: `trip:${trip._id}:budget:planned`,
      type: 'budget',
      severity: 'warning',
      title: 'Planned budget exceeded',
      message: `The estimate is PKR ${Number(trip.budgetBreakdown.overBy || 0).toLocaleString()} above the trip budget.`,
    });
  }

  const activeKeys = alerts.map((item) => item.dedupeKey);
  await Alert.updateMany(
    { userId: trip.userId, tripId: trip._id, ...(activeKeys.length ? { dedupeKey: { $nin: activeKeys } } : {}) },
    { $set: { active: false } }
  );

  const saved = [];
  for (const item of alerts) {
    saved.push(
      await Alert.findOneAndUpdate(
        { userId: trip.userId, dedupeKey: item.dedupeKey },
        { $set: { ...item, tripId: trip._id, active: true } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    );
  }
  return saved;
}

module.exports = { syncTripAlerts, detectHazards };
