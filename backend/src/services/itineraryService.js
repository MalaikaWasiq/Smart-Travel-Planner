const { createChatCompletion, groqConfig } = require('./groqService');

const typeCosts = {
  historic: 700,
  food: 1800,
  nature: 900,
  shopping: 1500,
  culture: 800,
};

function buildBudgetBreakdown(itinerary, budget) {
  const totals = {
    hotels: Math.round((Number(budget) || 0) * 0.28),
    food: 0,
    transport: 0,
    activities: 0,
  };

  for (const day of itinerary) {
    totals.transport += 1200;
    for (const activity of day.activities) {
      if (activity.type === 'food') totals.food += activity.estimatedCost;
      else totals.activities += activity.estimatedCost;
    }
  }

  const totalEstimated = totals.hotels + totals.food + totals.transport + totals.activities;

  return {
    ...totals,
    totalEstimated,
    remaining: (Number(budget) || 0) - totalEstimated,
  };
}

function generateRuleBasedItinerary({
  destination,
  days,
  budget,
  interests = [],
  forecast = [],
  startLocation = 'Islamabad',
  corridor = null,
}) {
  const totalDays = Math.min(Math.max(Number(days) || 1, 1), 14);
  const cityName = destination || corridor?.destination || 'Pakistan Destination';

  // Extract real places discovered dynamically from Map APIs
  const transitStops = (corridor?.corridorWaypoints || []).filter((w) => w.stage === 'transit');
  const destCandidateStops = (corridor?.destinationCandidateStops || []).map((s) => s.name);

  // If map corridor provided highlights, use them; otherwise use clean natural/cultural defaults
  const attractionPool = destCandidateStops.length > 0
    ? destCandidateStops
    : [
      `${cityName} Main Sightseeing Point`,
      `${cityName} Heritage Viewpoint`,
      `${cityName} Nature Trail`,
      `${cityName} Panorama Point`,
    ];

  const transitPointName = transitStops[0]?.name || 'Scenic Highway Rest Area';
  const midTransitPointName = transitStops[Math.floor(transitStops.length / 2)]?.name || transitPointName;

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const dayNum = index + 1;
    const forecastDay = forecast[index] || {};

    let morningSight = '';
    let lunchSpot = '';
    let eveningSight = '';
    let dinnerSpot = '';

    if (dayNum === 1) {
      morningSight = transitPointName;
      lunchSpot = `Highway Dining Stop near ${transitPointName}`;
      eveningSight = `${cityName} Approach Viewpoint`;
      dinnerSpot = `Local Dining Stop in ${cityName}`;
    } else if (dayNum === totalDays) {
      morningSight = attractionPool[index % attractionPool.length] || `${cityName} Final Viewpoint`;
      lunchSpot = `Transit Lunch Stop near ${midTransitPointName}`;
      eveningSight = `Return Highway Viewpoint towards ${startLocation}`;
      dinnerSpot = `Farewell Dinner Stop in ${startLocation}`;
    } else {
      morningSight = attractionPool[(index * 2) % attractionPool.length] || `${cityName} Morning Landmark`;
      eveningSight = attractionPool[(index * 2 + 1) % attractionPool.length] || `${cityName} Sunset Panorama`;
      lunchSpot = `Local Eatery near ${morningSight}`;
      dinnerSpot = `Traditional Dining in ${cityName}`;
    }

    const activities = [
      {
        time: '08:30 AM',
        timeBlock: 'Morning',
        place: dayNum === 1 ? `Highway drive from ${startLocation} via ${morningSight}` : `Scenic excursion: ${morningSight}`,
        type: 'historic',
        mealPolicy: 'Breakfast included with hotel room stay',
        description: dayNum === 1
          ? `Departure from ${startLocation} via highway route with scenic morning drive and stop at ${morningSight}.`
          : `Morning exploration of ${morningSight} with guided sightseeing and photo opportunities.`,
        estimatedCost: 600,
      },
      {
        time: '01:00 PM',
        timeBlock: 'Afternoon',
        place: `Lunch Break at ${lunchSpot}`,
        type: 'food',
        mealPolicy: 'Lunch self-paid (highway dhaba / scenic spot)',
        description: 'Midday relaxation break for lunch featuring regional Pakistani cuisine (self-paid).',
        estimatedCost: 900,
      },
      {
        time: '05:00 PM',
        timeBlock: 'Evening',
        place: `Sunset View & Photography at ${eveningSight}`,
        type: 'nature',
        mealPolicy: null,
        description: `Golden hour sunset panorama and photography session at ${eveningSight}.`,
        estimatedCost: 400,
      },
      {
        time: '08:00 PM',
        timeBlock: 'Night',
        place: `Hotel check-in & Dinner at ${dinnerSpot}`,
        type: 'food',
        mealPolicy: 'Dinner fixed menu included in tour package',
        description: 'Check-in at hotel or campsite, freshen up, followed by dinner (fixed menu included in package).',
        estimatedCost: 1400,
      },
    ];

    return {
      day: dayNum,
      title: dayNum === 1
        ? `Departure from ${startLocation} to ${cityName}`
        : dayNum === totalDays
          ? `Sightseeing & Return Journey to ${startLocation}`
          : `Exploring ${cityName} Highlights`,
      weatherNote: forecastDay.advisory || 'Optimal travel conditions expected. Wear comfortable footwear.',
      activities,
    };
  });

  return {
    cityName,
    itinerary,
    budgetBreakdown: buildBudgetBreakdown(itinerary, budget),
  };
}

function buildPrompt({
  destination,
  days,
  budget,
  interests = [],
  weather,
  forecast = [],
  attractions = [],
  startLocation = 'Islamabad',
  corridor = null,
}) {
  const verifiedMapPlaces = (corridor?.destinationCandidateStops || []).concat(
    (corridor?.corridorWaypoints || []).map((w) => ({
      name: w.name,
      type: w.type,
      latitude: w.latitude,
      longitude: w.longitude,
      stage: w.stage,
      distanceFromStartKm: w.distanceFromStartKm,
    }))
  );

  return [
    {
      role: 'system',
      content: [
        'You are an expert Pakistan travel planner designing an authentic, geographically accurate tour itinerary.',
        'Return only valid JSON. Do not include markdown, code fences, or explanations.',
        'CRITICAL ZERO-HALLUCINATION & FORMATTING RULES:',
        '1. DO NOT INVENT or hallucinate fictitious places, hotels, guest houses, cafes, or covered structures.',
        '2. You MUST prioritize and sequence the real physical places provided from the Map API along the highway route and at the destination.',
        '3. For wilderness areas, plateaus, and mountain passes (such as Deosai, Babusar, Khunjerab, Fairy Meadows): there are NO permanent masonry restaurants, covered cafes, or grand hotels inside the open park. Lunch must be packed/camping meals or roadside dhabas before entering the park. Lodging must be seasonal campsites or base-town hotels with day trips.',
        '4. DO NOT use emojis anywhere in your response. All text must be clean professional English.',
        '5. Every day must follow 4 sequential time blocks: Morning (08:30 AM), Afternoon (01:00 PM), Evening (05:00 PM), Night (08:00 PM).',
        'Use realistic local places in Pakistan, accurate timings, and PKR estimated costs.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Generate a structured tour package itinerary using verified map corridor points.',
        requiredResponseShape: {
          cityName: 'string',
          itinerary: [
            {
              day: 'number',
              title: 'string',
              weatherNote: 'string',
              activities: [
                {
                  time: 'string',
                  place: 'string',
                  type: 'string',
                  description: 'string',
                  estimatedCost: 'number',
                  latitude: 'number or null',
                  longitude: 'number or null',
                },
              ],
            },
          ],
          budgetBreakdown: {
            hotels: 'number',
            food: 'number',
            transport: 'number',
            activities: 'number',
            totalEstimated: 'number',
            remaining: 'number',
          },
        },
        constraints: {
          exactDaysRequired: Number(days),
          activitiesPerDay: 'exactly 4 sequential blocks: Morning, Afternoon, Evening, Night',
          departureCity: startLocation,
          destinationCity: destination,
          currency: 'PKR',
          noEmojis: true,
          preferProvidedAttractions: verifiedMapPlaces.length > 0 || attractions.length > 0,
        },
        userInput: {
          destination,
          startLocation,
          days: Number(days),
          budget: Number(budget),
          interests,
          weather,
          forecast,
          verifiedMapCorridor: verifiedMapPlaces,
          highwaysTraversed: corridor?.highwaysTraversed || [],
          totalDistanceKm: corridor?.totalDistanceKm || null,
          liveAttractionsFromWikipedia: attractions.map((attraction) => ({
            title: attraction.title,
            summary: attraction.summary,
            wikipediaUrl: attraction.wikipediaUrl,
            latitude: attraction.latitude,
            longitude: attraction.longitude,
          })),
        },
      }),
    },
  ];
}

function parseJsonObject(rawContent) {
  const trimmed = String(rawContent || '').trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch (_) {
    const candidates = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < withoutFence.length; index += 1) {
      const character = withoutFence[index];

      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === '{') {
        if (depth === 0) start = index;
        depth += 1;
      } else if (character === '}' && depth > 0) {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          candidates.push(withoutFence.slice(start, index + 1));
          start = -1;
        }
      }
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed?.cityName && Array.isArray(parsed?.itinerary) && parsed?.budgetBreakdown) return parsed;
      } catch (_) {
        // Continue through any reasoning fragments until the itinerary object is found.
      }
    }

    throw new Error('AI response did not contain a valid itinerary JSON object');
  }
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function validateGeneratedItinerary(data, expectedDays) {
  if (!data || typeof data !== 'object') throw new Error('AI response must be an object');
  if (!data.cityName || typeof data.cityName !== 'string') throw new Error('AI response missing cityName');
  if (!Array.isArray(data.itinerary)) throw new Error('AI response missing itinerary array');
  if (data.itinerary.length !== expectedDays) throw new Error('AI itinerary day count mismatch');

  for (const [dayIndex, day] of data.itinerary.entries()) {
    if (!isFiniteNumber(day.day)) throw new Error(`AI day ${dayIndex + 1} missing numeric day`);
    if (!day.title || typeof day.title !== 'string') throw new Error(`AI day ${dayIndex + 1} missing title`);
    if (!Array.isArray(day.activities)) throw new Error(`AI day ${dayIndex + 1} missing activities`);
    if (day.activities.length < 1) throw new Error(`AI day ${dayIndex + 1} has no activities`);

    for (const [activityIndex, activity] of day.activities.entries()) {
      if (!activity.time || typeof activity.time !== 'string') throw new Error(`AI activity ${activityIndex + 1} missing time`);
      if (!activity.place || typeof activity.place !== 'string') throw new Error(`AI activity ${activityIndex + 1} missing place`);
      if (!activity.type || typeof activity.type !== 'string') throw new Error(`AI activity ${activityIndex + 1} missing type`);
      if (!activity.description || typeof activity.description !== 'string') throw new Error(`AI activity ${activityIndex + 1} missing description`);
      if (!isFiniteNumber(activity.estimatedCost)) throw new Error(`AI activity ${activityIndex + 1} missing numeric estimatedCost`);
    }
  }

  const budget = data.budgetBreakdown;
  const budgetKeys = ['hotels', 'food', 'transport', 'activities', 'totalEstimated', 'remaining'];
  if (!budget || typeof budget !== 'object') throw new Error('AI response missing budgetBreakdown');
  for (const key of budgetKeys) {
    if (!isFiniteNumber(budget[key])) throw new Error(`AI budgetBreakdown.${key} must be numeric`);
  }
}

function stripEmojis(str) {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGeneratedItinerary(data, requestedDestination = '') {
  const canonicalCity = requestedDestination && requestedDestination.trim()
    ? requestedDestination.trim()
    : String(data.cityName || '').trim();

  return {
    cityName: stripEmojis(canonicalCity),
    itinerary: data.itinerary.map((day, dayIndex) => ({
      day: Number(day.day) || dayIndex + 1,
      title: stripEmojis(day.title),
      weatherNote: stripEmojis(day.weatherNote || 'Plan is balanced for the expected weather.'),
      activities: day.activities.map((activity, actIdx) => {
        let defaultBlock = 'Morning';
        let defaultMeal = 'Breakfast included with hotel room stay';
        if (actIdx === 1) {
          defaultBlock = 'Afternoon';
          defaultMeal = 'Lunch self-paid (highway dhaba / scenic spot)';
        } else if (actIdx === 2) {
          defaultBlock = 'Evening';
          defaultMeal = null;
        } else if (actIdx >= 3) {
          defaultBlock = 'Night';
          defaultMeal = 'Dinner fixed menu included in tour package';
        }

        return {
          time: stripEmojis(activity.time),
          timeBlock: stripEmojis(activity.timeBlock || defaultBlock),
          mealPolicy: activity.mealPolicy !== undefined && activity.mealPolicy !== null
            ? stripEmojis(activity.mealPolicy)
            : defaultMeal,
          place: stripEmojis(activity.place),
          type: stripEmojis(activity.type).toLowerCase(),
          description: stripEmojis(activity.description),
          estimatedCost: Math.max(0, Math.round(Number(activity.estimatedCost))),
          ...(activity.latitude !== null && activity.latitude !== undefined
            && activity.longitude !== null && activity.longitude !== undefined
            && isFiniteNumber(activity.latitude) && isFiniteNumber(activity.longitude)
            ? { latitude: Number(activity.latitude), longitude: Number(activity.longitude) }
            : {}),
        };
      }),
    })),
    budgetBreakdown: {
      hotels: Math.round(Number(data.budgetBreakdown.hotels)),
      food: Math.round(Number(data.budgetBreakdown.food)),
      transport: Math.round(Number(data.budgetBreakdown.transport)),
      activities: Math.round(Number(data.budgetBreakdown.activities)),
      totalEstimated: Math.round(Number(data.budgetBreakdown.totalEstimated)),
      remaining: Math.round(Number(data.budgetBreakdown.remaining)),
    },
  };
}

async function generateItinerary({
  destination,
  days,
  budget,
  interests = [],
  travelType = 'Solo',
  transportation = 'Private Car',
  comfortLevel = 'Normal',
  startLocation = 'Islamabad',
  weather,
  forecast = [],
  attractions = [],
  corridor = null,
}) {
  const normalizedDays = Math.min(Math.max(Number(days) || 1, 1), 14);
  const promptMessages = buildPrompt({
    destination,
    days: normalizedDays,
    budget,
    interests,
    weather,
    forecast,
    attractions,
    startLocation,
    corridor,
  });

  try {
    const completion = await createChatCompletion({
      messages: promptMessages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const parsed = parseJsonObject(completion?.choices?.[0]?.message?.content);
    validateGeneratedItinerary(parsed, normalizedDays);
    return normalizeGeneratedItinerary(parsed, destination);
  } catch (error) {
    console.warn(`[itineraryService] Groq generation failed (${error.message}). Falling back to map-grounded itinerary.`);
    const fallback = generateRuleBasedItinerary({
      destination,
      days: normalizedDays,
      budget,
      interests,
      forecast,
      startLocation,
      corridor,
    });
    return normalizeGeneratedItinerary(fallback, destination);
  }
}

module.exports = {
  generateItinerary,
  generateRuleBasedItinerary,
  validateGeneratedItinerary,
  buildPrompt,
  parseJsonObject,
};
