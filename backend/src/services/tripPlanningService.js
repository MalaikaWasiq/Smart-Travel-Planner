const { getWeather } = require('./weatherService');
const { getAttractionsSafe } = require('./attractionService');
const { generateItinerary } = require('./itineraryService');
const { buildTripRoutes } = require('./routeService');
const { getHotelRecommendations } = require('./hotelService');
const { calculateBudget } = require('./budgetService');
const { rankAttractions } = require('./recommendationService');

function attachKnownCoordinates(itinerary, attractions) {
  return itinerary.map((day) => ({
    ...day,
    activities: day.activities.map((activity) => {
      if (Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude)) return activity;
      const place = String(activity.place || '').toLowerCase();
      const match = attractions.find((attraction) => {
        const title = String(attraction.title || '').toLowerCase();
        return title === place || title.includes(place) || place.includes(title);
      });
      return Number.isFinite(match?.latitude) && Number.isFinite(match?.longitude)
        ? { ...activity, latitude: match.latitude, longitude: match.longitude }
        : activity;
    }),
  }));
}

async function buildPlan({ destination, days, budget, interests = [], expenses = [], userId }) {
  const [weatherResult, attractions] = await Promise.all([
    getWeather(destination, days),
    getAttractionsSafe(destination, interests, 10),
  ]);
  const ranking = attractions.length
    ? await rankAttractions({ userId, candidates: attractions, interests, weather: weatherResult.weather, budget, topK: 10 })
    : { recommendations: [], modelVersion: 'no-candidates', fallbackUsed: true };
  const rankedAttractions = ranking.recommendations;
  const generated = await generateItinerary({
    destination, days, budget, interests,
    weather: weatherResult.weather,
    forecast: weatherResult.forecast,
    attractions: rankedAttractions,
  });
  const withCoordinates = attachKnownCoordinates(generated.itinerary, rankedAttractions);
  const [route, hotelSuggestions] = await Promise.all([
    buildTripRoutes({ destination: generated.cityName, itinerary: withCoordinates }),
    Promise.resolve(getHotelRecommendations({ city: generated.cityName, budget, days })),
  ]);
  const itinerary = withCoordinates.map((day, index) => ({
    ...day,
    activities: route.days[index]?.activities || day.activities,
  }));
  return {
    destination: generated.cityName,
    days,
    budget,
    interests,
    weather: weatherResult.weather,
    forecast: weatherResult.forecast,
    attractions: rankedAttractions,
    recommendationMetadata: {
      modelVersion: ranking.modelVersion,
      fallbackUsed: Boolean(ranking.fallbackUsed),
      rankedAt: new Date(),
    },
    itinerary,
    itinerarySource: generated.source,
    route,
    hotels: hotelSuggestions,
    hotelSuggestions,
    selectedHotel: undefined,
    budgetBreakdown: calculateBudget({ budget, days, itinerary, route, hotelSuggestions, expenses }),
  };
}

module.exports = { buildPlan, attachKnownCoordinates };
