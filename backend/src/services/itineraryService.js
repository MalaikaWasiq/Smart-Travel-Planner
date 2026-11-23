const { createChatCompletion, groqConfig } = require('./groqService');

const cityData = {
  lahore: {
    name: 'Lahore',
    historic: ['Badshahi Mosque', 'Lahore Fort', 'Minar-e-Pakistan', 'Walled City of Lahore', 'Shalimar Gardens'],
    food: ['Food Street Gawalmandi', 'Andaaz Restaurant', 'Haveli Restaurant', 'Cooco Den Restaurant'],
    nature: ['Jilani Park', 'Bagh-e-Jinnah', 'Race Course Park', 'Shalimar Gardens'],
    shopping: ['Anarkali Bazaar', 'Liberty Market', 'Packages Mall', 'MM Alam Road'],
    culture: ['Lahore Museum', 'Alhamra Arts Council', 'Walled City Heritage Walk', 'National College of Arts'],
  },
  islamabad: {
    name: 'Islamabad',
    historic: ['Faisal Mosque', 'Pakistan Monument', 'Lok Virsa Museum', 'Saidpur Village'],
    food: ['Monal Restaurant', 'Kohsar Market', 'Saidpur Village Food Street', 'Tuscany Courtyard'],
    nature: ['Margalla Hills', 'Rawal Lake', 'Daman-e-Koh', 'Trail 5'],
    shopping: ['Centaurus Mall', 'Jinnah Super Market', 'F-7 Markaz', 'Melody Food Park'],
    culture: ['PNCA Gallery', 'Lok Virsa Museum', 'Pakistan Museum of Natural History'],
  },
  karachi: {
    name: 'Karachi',
    historic: ['Mohatta Palace', 'Quaid-e-Azam Mausoleum', 'Empress Market', 'Frere Hall'],
    food: ['Burns Road Food Street', 'Boat Basin Food Street', 'Kolachi Restaurant', 'BBQ Tonight'],
    nature: ['Clifton Beach', 'French Beach', 'Manora Island', 'Bagh Ibn-e-Qasim'],
    shopping: ['Dolmen Mall', 'Tariq Road', 'Zamzama Boulevard', 'Lucky One Mall'],
    culture: ['National Museum of Pakistan', 'Karachi Arts Council', 'TDF Ghar'],
  },
  hunza: {
    name: 'Hunza',
    historic: ['Baltit Fort', 'Altit Fort', 'Ganish Village', 'Karimabad Bazaar'],
    food: ['Cafe De Hunza', 'Old Hunza Inn Restaurant', 'Eagles Nest Dining', 'Local Apricot Cafe'],
    nature: ['Attabad Lake', 'Rakaposhi View Point', 'Borith Lake', 'Passu Cones'],
    shopping: ['Hunza Gems Market', 'Karimabad Market', 'Local Handicraft Shops'],
    culture: ['Hunza Cultural Show', 'Heritage Walk', 'Local Pottery Workshop'],
  },
  skardu: {
    name: 'Skardu',
    historic: ['Skardu Fort', 'Shigar Fort', 'Kharpocho Fort', 'Ancient Rock Carvings'],
    food: ['Shangrila Restaurant', 'K2 Motel Dining', 'Mountain View Cafe', 'Balti Food House'],
    nature: ['Shangrila Lake', 'Upper Kachura Lake', 'Satpara Lake', 'Cold Desert'],
    shopping: ['Skardu Bazaar', 'Gem Stone Shops', 'Local Dry Fruit Market'],
    culture: ['Skardu Museum', 'Balti Cultural Show', 'Buddhist Rock Carvings'],
  },
  murree: {
    name: 'Murree',
    historic: ['Christ Church Murree', 'GPO Chowk', 'Kashmir Point', 'Pindi Point'],
    food: ['Mall Road Cafes', 'Lintotts Restaurant', 'Cecil Hotel Dining'],
    nature: ['Patriata New Murree', 'Ayubia National Park', 'Nathia Gali', 'Thandiani'],
    shopping: ['Mall Road Murree', 'Local Woolen Market', 'Souvenir Bazaar'],
    culture: ['British Era Buildings', 'Pine Forest Walk', 'Murree Hills Festival'],
  },
  swat: {
    name: 'Swat',
    historic: ['Swat Museum', 'Butkara Stupa', 'Udegram Fort', 'Jehanabad Buddha'],
    food: ['Fizagat Park Cafe', 'Kalam Valley Restaurant', 'Serena Hotel Swat'],
    nature: ['Malam Jabba', 'Fizagat Park', 'Kalam Valley', 'Mahodand Lake'],
    shopping: ['Mingora Bazaar', 'Swat Embroidery Shops', 'Local Gem Market'],
    culture: ['Swat Cultural Museum', 'Saidu Sharif Museum', 'Traditional Dance Show'],
  },
  peshawar: {
    name: 'Peshawar',
    historic: ['Peshawar Museum', 'Bala Hisar Fort', 'Sethi House', 'Mahabat Khan Mosque'],
    food: ['Namak Mandi Chapli Kabab', 'Charsi Tikka', 'Qissa Khwani Food Street'],
    nature: ['Warsak Dam', 'Shahi Bagh', 'Hayatabad Park'],
    shopping: ['Saddar Bazaar', 'Karkhano Market', 'Qissa Khwani Bazaar'],
    culture: ['Khyber Museum', 'Gor Khatri Archaeological Site', 'Deans Hotel'],
  },
};

const timeSlots = ['8:30 AM', '10:30 AM', '1:00 PM', '3:30 PM', '6:00 PM'];
const dayTitles = [
  'Arrival and City Highlights',
  'Heritage and Local Culture',
  'Nature and Food Trail',
  'Markets and Hidden Spots',
  'Relaxed Local Experience',
  'Scenic Day Plan',
  'Farewell Highlights',
];

const typeCosts = {
  historic: 700,
  food: 1800,
  nature: 900,
  shopping: 1500,
  culture: 800,
};

function cityFor(destination) {
  const key = String(destination || '').trim().toLowerCase().split(' ')[0];
  return cityData[key] || {
    name: destination,
    historic: ['Old City Tour', 'Historic Fort', 'Heritage Museum'],
    food: ['Local Food Street', 'Traditional Restaurant', 'Rooftop Cafe'],
    nature: ['City Park', 'View Point', 'Lake Side Walk'],
    shopping: ['Main Bazaar', 'Souvenir Market', 'City Mall'],
    culture: ['City Museum', 'Cultural Center', 'Art Gallery'],
  };
}

function preferredTypesForWeather(day) {
  if (day?.isRainy || day?.isSnowy) {
    return ['culture', 'food', 'shopping', 'historic', 'food'];
  }

  if (day?.isHot) {
    return ['nature', 'historic', 'food', 'culture', 'shopping'];
  }

  if (day?.isCold) {
    return ['historic', 'food', 'culture', 'shopping', 'food'];
  }

  return ['nature', 'historic', 'food', 'culture', 'shopping'];
}

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

function generateRuleBasedItinerary({ destination, days, budget, interests = [], forecast = [], startLocation = 'Lahore' }) {
  const city = cityFor(destination);
  const totalDays = Math.min(Math.max(Number(days) || 1, 1), 14);

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const dayNum = index + 1;
    const forecastDay = forecast[index] || {};

    const sightseeingPool = [...(city.nature || []), ...(city.historic || []), ...(city.culture || [])];
    const morningSight = sightseeingPool[(index * 2) % sightseeingPool.length] || 'Scenic Viewpoint';
    const eveningSight = sightseeingPool[(index * 2 + 1) % sightseeingPool.length] || 'Sunset Point';
    const foodPool = city.food || ['Local Traditional Restaurant', 'Heritage Food Street', 'Riverside Cafe'];
    const lunchSpot = foodPool[index % foodPool.length] || 'Highway Restaurant';
    const dinnerSpot = foodPool[(index + 1) % foodPool.length] || 'Hotel Restaurant';

    // Supervisor's Exact 4 Daily Blocks:
    // Morning -> Highway drive + Sightseeing stop.
    // Afternoon -> Break for lunch.
    // Evening -> Sunset view + photograph.
    // Night -> Hotel check-in + dinner.
    const activities = [
      {
        time: '8:30 AM',
        timeBlock: 'Morning',
        place: dayNum === 1 ? `Highway drive from ${startLocation} & ${morningSight}` : `Scenic excursion: ${morningSight}`,
        type: 'historic',
        mealPolicy: 'Breakfast included with hotel room stay',
        description: dayNum === 1
          ? `Departure from ${startLocation} via highway route with scenic morning drive and stop at ${morningSight}.`
          : `Morning tour to ${morningSight} with guided exploration and scenic stops.`,
        estimatedCost: 600,
      },
      {
        time: '1:00 PM',
        timeBlock: 'Afternoon',
        place: `Lunch Break at ${lunchSpot}`,
        type: 'food',
        mealPolicy: 'Lunch self-paid (highway dhaba / scenic spot)',
        description: 'Midday relaxation break for lunch featuring local Pakistani cuisine (self-paid).',
        estimatedCost: 900,
      },
      {
        time: '5:00 PM',
        timeBlock: 'Evening',
        place: `Sunset View & Photography at ${eveningSight}`,
        type: 'nature',
        mealPolicy: null,
        description: `Golden hour sunset panorama and photography session at ${eveningSight}.`,
        estimatedCost: 400,
      },
      {
        time: '8:00 PM',
        timeBlock: 'Night',
        place: `Hotel check-in & Dinner at ${dinnerSpot}`,
        type: 'food',
        mealPolicy: 'Dinner fixed menu included in tour package',
        description: 'Check-in at hotel, freshen up, followed by a warm dinner (fixed menu included in package).',
        estimatedCost: 1400,
      },
    ];

    return {
      day: dayNum,
      title: dayNum === 1
        ? `Departure from ${startLocation} ➔ ${city.name}`
        : dayNum === totalDays
          ? `Sightseeing & Return Journey`
          : `Exploring ${city.name} Highlights`,
      weatherNote: forecastDay.advisory || 'Optimal travel conditions expected. Wear comfortable footwear.',
      activities,
    };
  });

  return {
    cityName: city.name,
    itinerary,
    budgetBreakdown: buildBudgetBreakdown(itinerary, budget),
  };
}

function buildPrompt({ destination, days, budget, interests = [], weather, forecast = [], attractions = [], startLocation = 'Islamabad' }) {
  return [
    {
      role: 'system',
      content: [
        'You are an expert Pakistan travel planner designing a professional structured tour itinerary.',
        'Return only valid JSON. Do not include markdown, code fences, or explanations.',
        'CRITICAL RULE: For every single day, structure the activities into exactly 4 sequential time blocks matching standard commercial tours:',
        '1. Morning (08:30 AM): Highway drive / scenic transit from departure city + Sightseeing stop.',
        '2. Afternoon (01:00 PM): Break for lunch (self-paid local dining stop).',
        '3. Evening (05:00 PM): Sunset view + photography session at a scenic viewpoint.',
        '4. Night (08:00 PM): Hotel check-in + dinner (fixed menu included in tour package).',
        'Use realistic local places in Pakistan, accurate timings, and PKR estimated costs.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Generate a structured tour package itinerary.',
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
          preferProvidedAttractions: attractions.length > 0,
        },
        userInput: {
          destination,
          startLocation,
          days: Number(days),
          budget: Number(budget),
          interests,
          weather,
          forecast,
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

function normalizeGeneratedItinerary(data, requestedDestination = '') {
  const canonicalCity = requestedDestination && requestedDestination.trim()
    ? requestedDestination.trim()
    : String(data.cityName || '').trim();

  return {
    cityName: canonicalCity,
    itinerary: data.itinerary.map((day, dayIndex) => ({
      day: Number(day.day) || dayIndex + 1,
      title: String(day.title).trim(),
      weatherNote: String(day.weatherNote || 'Plan is balanced for the expected weather.').trim(),
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
          time: String(activity.time).trim(),
          timeBlock: activity.timeBlock || defaultBlock,
          mealPolicy: activity.mealPolicy !== undefined ? activity.mealPolicy : defaultMeal,
          place: String(activity.place).trim(),
          type: String(activity.type).trim().toLowerCase(),
          description: String(activity.description).trim(),
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

async function generateAiItinerary(input) {
  const messages = buildPrompt(input);
  const content = await createChatCompletion({
    messages,
    maxTokens: 4000,
    responseFormat: { type: 'json_object' },
  });
  const parsed = parseJsonObject(content);
  const expectedDays = Math.min(Math.max(Number(input.days) || 1, 1), 14);
  validateGeneratedItinerary(parsed, expectedDays);
  return normalizeGeneratedItinerary(parsed, input.destination);
}

async function generateItinerary(input) {
  try {
    return { ...(await generateAiItinerary(input)), source: 'groq' };
  } catch (error) {
    const { model } = groqConfig();
    console.warn(`[itinerary] Falling back to rule-based generator. Groq model=${model}. Reason: ${error.message}`);
    return { ...generateRuleBasedItinerary(input), source: 'fallback' };
  }
}

module.exports = { generateItinerary, generateRuleBasedItinerary, generateAiItinerary };
