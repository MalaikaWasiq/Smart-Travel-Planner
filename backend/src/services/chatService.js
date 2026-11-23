const { createChatCompletion, groqConfig } = require('./groqService');
const destinationsData = require('../data/pakistanDestinations.json');
const weatherService = require('./weatherService');

// Index destinations for fast lookup
const destinationById = new Map();
const destinationByName = new Map();

destinationsData.forEach((d) => {
  if (d.destinationId) destinationById.set(d.destinationId.toLowerCase(), d);
  if (d.name) destinationByName.set(d.name.toLowerCase(), d);
});

// Super-compact catalog index for system prompt to conserve tokens
const catalogSummary = destinationsData.map((d) => `${d.destinationId}:${d.name}`).join(', ');

function money(value) {
  return `PKR ${Number(value || 0).toLocaleString()}`;
}

function cleanAssistantContent(content) {
  let cleaned = String(content || '')
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .trim();
  if (!cleaned && content) {
    cleaned = String(content).replace(/<\/?think>/gi, '').trim();
  }
  return cleaned;
}

/**
 * Extracts recommended destination IDs from text or tag
 */
function extractRecommendedDestinations(text = '', query = '') {
  const ids = [];
  const tagMatch = text.match(/\[RECOMMENDED_DESTINATIONS:\s*([^\]]+)\]/i);

  if (tagMatch) {
    const rawIds = tagMatch[1].split(',').map((s) => s.trim().toLowerCase());
    for (const rawId of rawIds) {
      if (destinationById.has(rawId) && !ids.includes(rawId)) {
        ids.push(rawId);
      }
    }
  }

  // If no tag or tag didn't match, check destination names in text
  if (ids.length === 0) {
    const combined = `${query} ${text}`.toLowerCase();
    for (const dest of destinationsData) {
      const nameLower = dest.name.toLowerCase();
      // Match whole words or strong phrases
      if (combined.includes(nameLower) || combined.includes(dest.destinationId.toLowerCase())) {
        if (!ids.includes(dest.destinationId)) {
          ids.push(dest.destinationId);
          if (ids.length >= 3) break;
        }
      }
    }
  }

  const cleanText = text.replace(/\[RECOMMENDED_DESTINATIONS:[^\]]+\]/gi, '').trim();

  const destinations = ids.slice(0, 4).map((id) => {
    const d = destinationById.get(id);
    return {
      destinationId: d.destinationId,
      id: d.destinationId,
      name: d.name,
      category: d.category,
      region: d.region,
      imageUrl: d.imageUrl,
      rating: d.rating,
      bestTimeToVisit: d.bestTimeToVisit,
      travelDifficulty: d.travelDifficulty,
      description: d.description,
      popularActivities: d.popularActivities || [],
    };
  });

  return { cleanText, destinations };
}

/**
 * Helper to fetch real weather if the user's message is asking for current weather
 */
async function checkAndFetchWeatherContext(message) {
  const lower = String(message || '').toLowerCase();
  const isWeatherQuery =
    lower.includes('weather') ||
    lower.includes('mosam') ||
    lower.includes('forecast') ||
    lower.includes('temperature') ||
    lower.includes('temp') ||
    lower.includes('barish') ||
    lower.includes('rain') ||
    lower.includes('snow');

  if (!isWeatherQuery) return null;

  for (const dest of destinationsData) {
    if (lower.includes(dest.name.toLowerCase()) || lower.includes(dest.weatherCity?.toLowerCase())) {
      try {
        const city = dest.weatherCity || dest.name;
        const weatherData = await weatherService.getWeather(city);
        if (weatherData?.weather) {
          return `Real-time weather data for ${dest.name} (${city}): Current temperature ${weatherData.weather.temp}°C (feels like ${weatherData.weather.feelsLike}°C), condition: "${weatherData.weather.description}", humidity: ${weatherData.weather.humidity}%, wind: ${weatherData.weather.wind} m/s. Mention these verified facts accurately.`;
        }
      } catch (_) {
        return null;
      }
    }
  }
  return null;
}

/**
 * Generates natural suggested action prompts based on message/context
 */
function generateSuggestedActions(userMessage, destinations) {
  const lower = String(userMessage || '').toLowerCase();

  if (destinations && destinations.length > 0) {
    const firstDest = destinations[0].name;
    return [
      `What is the best time to visit ${firstDest}?`,
      `How to reach ${firstDest}?`,
      `What should I pack for ${firstDest}?`,
      'Find more peaceful destinations',
    ];
  }

  if (lower.includes('beach') || lower.includes('coastal') || lower.includes('gwadar') || lower.includes('kund malir')) {
    return [
      'Tell me about Kund Malir Beach',
      'Is Astola Island safe for camping?',
      'Best time for coastal road trips',
      'Recommend mountain valleys instead',
    ];
  }

  if (lower.includes('family') || lower.includes('kids') || lower.includes('children')) {
    return [
      'Family-friendly hotels in Northern Areas',
      'Best scenic destinations for children',
      'Road conditions for family cars',
      'Suggest cultural cities like Lahore',
    ];
  }

  if (lower.includes('food') || lower.includes('culture') || lower.includes('khana')) {
    return [
      'Top traditional foods to try in Pakistan',
      'Famous food spots in Lahore',
      'Traditional dishes of Gilgit-Baltistan',
      'Cultural etiquette for tourists',
    ];
  }

  return [
    'Explore Northern Areas of Pakistan',
    'Find peaceful destinations',
    'Travel safety tips',
    'Best time to visit Hunza and Skardu',
  ];
}

/**
 * Main SafarSaathi AI travel assistant response generator
 */
async function answerTravelQuestion({ message, trip, appContext = {}, history = [] }) {
  const safeMessage = String(message || '').trim().slice(0, 1000);
  if (!safeMessage) throw new Error('Message is required');

  // Check if real-time weather info is requested
  const weatherContext = await checkAndFetchWeatherContext(safeMessage);

  const systemInstructions = [
    'You are SafarSaathi AI, the intelligent travel and tourism companion of Smart Travel Planner.',
    'Your Subtitle: Your Smart Travel & Tourism Companion.',
    '',
    '## PERSONALITY & CONVERSATION STYLE:',
    '- You are an expert, friendly, culturally respectful, and insightful travel guide.',
    '- Communicate naturally and engagingly, just like ChatGPT.',
    '- You understand and reply seamlessly in English, simple conversational English, Roman Urdu (e.g., "bhai Hunza jane ka best time kya hai", "family k sath peaceful places btao"), and Urdu script.',
    '- Always respond in the SAME language and style the user uses.',
    '',
    '## WIDE TRAVEL & TOURISM EXPERTISE:',
    '1. DESTINATIONS: Mountains, valleys, lakes, pristine coastal beaches (Gwadar, Kund Malir, Astola), historic monuments (Mohenjo-daro, Badshahi Mosque, Rohtas Fort), national parks (Deosai), cultural capitals (Lahore, Multan, Peshawar), peaceful spots, and adventure hubs.',
    '2. TRAVEL PLANNING: Best seasons/months, recommended trip duration, preparation, essential packing advice (layers, thermal gear, trekking shoes, sunblock), comparisons (e.g. Hunza vs Skardu, Swat vs Kumrat).',
    '3. TRANSPORTATION: Karakoram Highway (KKH), Makran Coastal Highway, 4x4 jeep requirements for rugged tracks (Deosai, Fairy Meadows, Kumrat), public buses (Daewoo, Faisal Movers), domestic flights (Skardu/Gilgit/Gwadar), fuel and vehicle tips.',
    '4. ACCOMMODATION: Types of stays (resorts, riverside camps, guest houses, boutique hotels), room selection tips, mountain heating availability. NEVER claim real-time room availability or invent fake prices.',
    '5. FOOD & CULTURE: Regional Pakistani cuisines (Chapli Kabab in Peshawar/KPK, Trout fish in Swat/Kaghan, Sajji in Balochistan, Karahi & Nihari in Lahore/Karachi, Apricot dishes & walnut cake in Hunza), cultural etiquette, welcoming local traditions, dress guidelines in conservative valleys.',
    '6. ADVENTURE & ACTIVITIES: Trekking, Attabad Lake boating, Malam Jabba skiing, stargazing in Deosai, photography viewpoints, water activities, high-altitude hiking.',
    '7. TRAVEL SAFETY & RESPONSIBLE TOURISM: Mountain safety, altitude sickness awareness, winter road precautions, landslide preparedness, leave-no-trace ecotourism, supporting local artisans.',
    '8. BUDGET & EXPENSES: Realistic ballpark budget guidance and cost-saving tips. Do not fabricate exact live rates.',
    '9. GENERAL INTERNATIONAL TRAVEL: Passport validity rules, general visa preparation (always advise users to verify official embassy/consulate sources), airport navigation, international travel insurance.',
    '',
    '## DESTINATIONS IN THE APPLICATION CATALOG:',
    'Smart Travel Planner has a catalog of 48 verified Pakistan destinations. Here is the catalog summary:',
    JSON.stringify(catalogSummary),
    '',
    '## DESTINATION RECOMMENDATION TAG:',
    'When you recommend specific destinations from the catalog above, mention them naturally in your response, and append this tag at the VERY END of your response:',
    '[RECOMMENDED_DESTINATIONS: destId1, destId2]',
    'Example: [RECOMMENDED_DESTINATIONS: hunza, skardu]',
    'Only include valid destination IDs from the catalog. Max 4 destinations. If you are answering a general query without recommending specific destinations from the catalog, omit the tag.',
    '',
    '## APPLICATION FEATURE BOUNDARIES:',
    '- If the user asks for a complete day-by-day itinerary with exact timetable/schedules, provide helpful highlights/recommendations, and warmly guide them: "For an interactive day-by-day plan with turn-by-turn route maps, hotel bookings, and budget tracking, you can use our **Plan a Trip** feature in the app!"',
    '- Never fabricate current weather, road blockages, or live room availability. If live weather context is provided below, use it accurately; otherwise give typical seasonal weather and suggest checking the destination page in the app.',
    '',
    '## CONTEXT AWARENESS:',
    '- Understand follow-up questions, pronouns ("there", "which one is better"), previous messages, and preference shifts (e.g., if user switches from mountains to beaches, adapt immediately).',
  ];

  if (weatherContext) {
    systemInstructions.push(`## VERIFIED REAL-TIME WEATHER:\n${weatherContext}`);
  }

  if (appContext && (appContext.activeTrip || appContext.user)) {
    systemInstructions.push(`## USER APPLICATION CONTEXT:\n${JSON.stringify({
      activeTrip: appContext.activeTrip ? {
        destination: appContext.activeTrip.destination,
        days: appContext.activeTrip.days,
        plannedBudget: appContext.activeTrip.plannedBudget,
      } : null,
      preferences: appContext.user?.preferences || null,
    })}`);
  }

  // Format conversation history for Groq without duplicate tail user message
  const safeHistory = (history || [])
    .filter((item) => item && item.content && String(item.content).trim())
    .slice(-8)
    .filter((item, idx, arr) => {
      if (idx === arr.length - 1 && item.role === 'user' && item.content.trim() === safeMessage.trim()) {
        return false;
      }
      return true;
    });

  const conversationMessages = [
    { role: 'system', content: systemInstructions.join('\n') },
    ...safeHistory.map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').slice(0, 600),
    })),
    { role: 'user', content: safeMessage },
  ];

  try {
    const rawContent = await createChatCompletion({
      temperature: 0.5,
      maxTokens: 800,
      messages: conversationMessages,
    });

    const cleanedRaw = cleanAssistantContent(rawContent);
    if (!cleanedRaw || cleanedRaw.length < 15) {
      throw new Error('Groq returned insufficient content');
    }

    const { cleanText, destinations } = extractRecommendedDestinations(cleanedRaw, safeMessage);
    const suggestedActions = generateSuggestedActions(safeMessage, destinations);

    return {
      content: cleanText || cleanedRaw,
      recommendedDestinations: destinations,
      suggestedActions,
      model: groqConfig().model,
      fallbackUsed: false,
    };
  } catch (error) {
    console.warn(`[chatService] Groq API call error: ${error.message}`);

    // High quality rich travel fallback so the user always receives a ChatGPT-grade answer
    const isPeaceQuery = /peace|calm|quiet|sukoon|relax|nature/i.test(safeMessage);
    let fallbackText = '';

    if (isPeaceQuery) {
      fallbackText =
        `### 🌿 Peaceful & Tranquil Destinations in Pakistan\n\n` +
        `If you are seeking peace, fresh mountain air, and a break from the noise of city life, here are the top tranquil escapes across Pakistan:\n\n` +
        `1. **Neelum Valley (Azad Kashmir)**: Known for lush alpine woods, roaring crystalline rivers, and serene village walks in Keran, Sharda, and Arang Kel. Early morning mist over the river offers unmatched peace.\n` +
        `   * **Best Time:** May to October\n` +
        `   * **Vibe:** Slow-paced, lush green, riverside relaxation.\n\n` +
        `2. **Kumrat Valley (Khyber Pakhtunkhwa)**: A secluded alpine wilderness in Upper Dir with towering deodar forests, wooden bridges, and riverside campsites far away from busy commercial areas.\n` +
        `   * **Best Time:** May to September\n` +
        `   * **Vibe:** Untouched, scenic solitude, forest tranquility.\n\n` +
        `3. **Kalam Valley & Ushu Forest (Swat)**: Famous for cool mountain breezes, deodar pine fragrance, and peaceful glacial waters at Mahodand Lake.\n` +
        `   * **Best Time:** April to October\n` +
        `   * **Vibe:** Mountain retreat, family friendly, fresh trout and pine trails.\n\n` +
        `4. **Kund Malir & Ormara Beach (Balochistan Coast)**: Pristine white sand beaches along the Makran Coastal Highway with calm Arabian Sea waves and breathtaking starry night skies.\n` +
        `   * **Best Time:** October to March\n` +
        `   * **Vibe:** Coastal calm, quiet waves, stargazing.\n\n` +
        `### 💡 Tips for a Peaceful Journey:\n` +
        `- Plan travel on weekdays to avoid weekend crowds.\n` +
        `- Book peaceful boutique guesthouses or riverside cottages rather than crowded main bazaars.\n` +
        `- Keep warm layers for chilly mountain evenings.\n\n` +
        `Which setting appeals to you more: lush mountain valleys, pine forests, or quiet coastal shores?`;
    } else {
      fallbackText =
        `### 🌄 Welcome to SafarSaathi AI! Your Pakistan Travel Guide\n\n` +
        `Pakistan offers world-class travel experiences across high mountains, historic heritage cities, and sunny coastal beaches:\n\n` +
        `* **Northern Wonders**: Hunza, Skardu, Fairy Meadows, Naran-Kaghan, and Swat Valley.\n` +
        `* **Historical & Cultural**: Lahore Fort, Badshahi Mosque, Rohtas Fort, Taxila Gandhara ruins, and Multan shrines.\n` +
        `* **Coastal Adventures**: Gwadar, Kund Malir Beach, Astola Island, and Ormara.\n\n` +
        `Tell me your preferred trip style, number of days, or budget, and I'll create a customized recommendation for you!`;
    }

    const { cleanText, destinations } = extractRecommendedDestinations(fallbackText, safeMessage);
    const suggestedActions = generateSuggestedActions(safeMessage, destinations);

    return {
      content: fallbackText,
      recommendedDestinations: destinations,
      suggestedActions,
      model: 'safarsaathi-expert',
      fallbackUsed: true,
      error: error.message,
    };
  }
}

module.exports = {
  answerTravelQuestion,
  extractRecommendedDestinations,
};
