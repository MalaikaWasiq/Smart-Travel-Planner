const { getWeather } = require('./weatherService');
const { getAttractionsSafe } = require('./attractionService');
const { generateItinerary } = require('./itineraryService');
const { buildTripRoutes } = require('./routeService');
const { getHotelRecommendations, findHotelById } = require('./hotelService');
const { calculateBudget } = require('./budgetService');
const { rankAttractions } = require('./recommendationService');
const { detectHazards } = require('./alertService');

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

async function buildPlan({
  destination,
  days,
  budget,
  budgetPerPerson,
  numberOfPersons = 1,
  interests = [],
  expenses = [],
  userId,
  travelType = 'Solo',
  transportation = 'Private Car',
  vehicleType,
  driverRequired = false,
  travelerGender = 'mixed',
  maleCount = 0,
  femaleCount = 0,
  comfortLevel = 'Normal',
  hotelRequired = true,
  selectedHotelId,
  selectedRoomId,
  startLocation = 'Lahore',
  startDate,
  endDate,
  category = '',
  tripMode = 'customized',
  transportChoice = 'rental',
  preferredRoute = '',
  foodChoice = 'included',
  optionalActivities = [],
  optionalExperiences = [],
  transportRequired = true,
  foodRequired = true,
  activitiesRequired = true,
  roomsQuantity = 1,
  selectedMeals = { breakfast: true, lunch: false, dinner: true },
}) {
  const normalizedPersons = Math.max(1, Number(numberOfPersons) || 1);
  const normalizedDays = Math.max(1, Number(days) || 1);
  const nights = Math.max(1, normalizedDays - 1);
  const rooms = Math.max(1, Number(roomsQuantity) || 1);

  // If budget per person is provided (supervisor handwritten flow), compute total budget
  const totalBudget = Number(budget) || (Number(budgetPerPerson) ? Number(budgetPerPerson) * normalizedPersons : 38500 * normalizedPersons);

  // Supervisor Rule: If budget is low, system manages hotel stay & transport, customer handles food on their own
  const isLowBudget = totalBudget > 0 && totalBudget < (normalizedPersons * normalizedDays * 3500);
  const effectiveFoodChoice = isLowBudget ? 'self' : foodChoice;
  const effectiveFoodRequired = isLowBudget ? false : foodRequired;

  // For 4 persons on low budget, optimize to 1 Family Quad room instead of forcing 2 rooms
  let effectiveRooms = rooms;
  if (isLowBudget && normalizedPersons <= 4 && rooms > 1) {
    effectiveRooms = 1;
  }

  const hotelBudgetShare = isLowBudget ? 0.50 : 0.35;
  const dailyHotelBudget = Math.round((totalBudget * hotelBudgetShare) / (nights * effectiveRooms));

  const [weatherResult, attractions] = await Promise.all([
    getWeather(destination, normalizedDays),
    getAttractionsSafe(destination, interests, 10),
  ]);

  const ranking = attractions.length
    ? await rankAttractions({ userId, candidates: attractions, interests, weather: weatherResult.weather, budget: totalBudget, topK: 10 })
    : { recommendations: [], modelVersion: 'no-candidates', fallbackUsed: true };
  const rankedAttractions = ranking.recommendations;

  // Itinerary generation personalized by travelType, transportation, comfortLevel & 4 time blocks
  const generated = await generateItinerary({
    destination,
    days: normalizedDays,
    budget: totalBudget,
    interests,
    travelType,
    transportation,
    comfortLevel,
    startLocation,
    weather: weatherResult.weather,
    forecast: weatherResult.forecast,
    attractions: rankedAttractions,
  });

  const withCoordinates = attachKnownCoordinates(generated.itinerary, rankedAttractions);

  // Smart Expense Controller: pass dailyHotelBudget to filter hotels according to supervisor rule
  const [route, hotelSuggestions] = await Promise.all([
    buildTripRoutes({ destination: generated.cityName, itinerary: withCoordinates }),
    Promise.resolve(getHotelRecommendations({
      city: generated.cityName,
      budget: totalBudget,
      days: normalizedDays,
      comfortLevel,
      dailyHotelBudget,
      roomsQuantity: effectiveRooms,
      numberOfPersons: normalizedPersons,
    })),
  ]);

  const itinerary = withCoordinates.map((day, index) => ({
    ...day,
    activities: route.days[index]?.activities || day.activities,
  }));

  // Resolve hotel selection & room (budget-conscious)
  let selectedHotel = null;

  if (hotelRequired && hotelRequired !== false) {
    if (selectedHotelId) {
      const found = findHotelById(selectedHotelId);
      if (found) {
        // Pick specific selected room, or room within dailyHotelBudget, or cheapest available room
        const room = (found.rooms || []).find((r) => r.id === selectedRoomId)
          || (found.rooms || []).find((r) => Number(dailyHotelBudget) > 0 && r.price <= Number(dailyHotelBudget) * 1.15)
          || (found.rooms || []).slice().sort((a, b) => a.price - b.price)[0]
          || found.rooms?.[0];
        const price = room?.price || found.pricePerNight;
        selectedHotel = {
          ...found,
          selectedRoom: room || null,
          roomsQuantity: effectiveRooms,
          totalStayCost: price * nights * effectiveRooms,
          nights,
        };
      }
    } else if (hotelSuggestions.length) {
      const bestChoice = hotelSuggestions.find((h) => h.withinBudget) || hotelSuggestions[0];
      const room = bestChoice.defaultRoom
        || bestChoice.selectedRoom
        || (bestChoice.rooms || []).find((r) => Number(dailyHotelBudget) > 0 && r.price <= Number(dailyHotelBudget) * 1.15)
        || (bestChoice.rooms || []).slice().sort((a, b) => a.price - b.price)[0]
        || bestChoice.rooms?.[0];
      const price = room?.price || bestChoice.pricePerNight;
      const hotelStay = bestChoice.totalStayCost || (price * nights * effectiveRooms);
      selectedHotel = {
        ...bestChoice,
        selectedRoom: room || null,
        roomsQuantity: effectiveRooms,
        totalStayCost: hotelStay,
        nights,
      };
    }
  }

  // Calculate budget breakdown with actual costs & destination-specific food plan
  const canonicalDest = destination ? destination.trim() : (generated.cityName || 'Destination');
  const budgetBreakdown = calculateBudget({
    budget: totalBudget,
    budgetPerPerson: Number(budgetPerPerson) || Math.round(totalBudget / normalizedPersons),
    numberOfPersons: normalizedPersons,
    travelerGender: travelerGender || 'mixed',
    maleCount: Number(maleCount) || 0,
    femaleCount: Number(femaleCount) || 0,
    days: normalizedDays,
    destination: canonicalDest,
    itinerary,
    route,
    selectedHotel,
    hotelSuggestions,
    expenses,
    vehicleType,
    driverRequired,
    tripMode,
    transportChoice,
    foodChoice,
    hotelRequired,
    transportRequired,
    foodRequired,
    activitiesRequired,
    selectedActivities: optionalActivities,
    optionalExperiences,
    roomsQuantity: effectiveRooms,
    selectedMeals,
  });

  // Detect weather & road hazards along the route
  const safetyAdvisory = detectHazards({
    destination: canonicalDest,
    weather: weatherResult.weather,
    forecast: weatherResult.forecast,
    route,
  });

  return {
    destination: canonicalDest,
    startLocation,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || undefined,
    category,
    tripMode,
    transportChoice,
    preferredRoute,
    foodChoice,
    optionalActivities,
    optionalExperiences,
    days: normalizedDays,
    budget: totalBudget,
    budgetPerPerson: budgetBreakdown.budgetPerPerson,
    numberOfPersons: normalizedPersons,
    travelerGender: travelerGender || 'mixed',
    maleCount: Number(maleCount) || 0,
    femaleCount: Number(femaleCount) || 0,
    interests,
    travelType,
    transportation: budgetBreakdown.vehicleDetails?.name || transportation,
    vehicleDetails: budgetBreakdown.vehicleDetails,
    foodPlan: budgetBreakdown.foodPlan,
    packageDetails: budgetBreakdown.packageDetails,
    budgetAllocation: budgetBreakdown.allocation,
    budgetDeductions: budgetBreakdown.budgetDeductions,
    comfortLevel,
    hotelRequired: Boolean(hotelRequired),
    weather: weatherResult.weather,
    forecast: weatherResult.forecast,
    safetyAdvisory,
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
    selectedHotel: selectedHotel || undefined,
    hotel: selectedHotel || undefined,
    budgetSummary: {
      totalBudget,
      estimatedTripCost: budgetBreakdown.totalEstimated,
      remainingBudget: budgetBreakdown.remaining,
      hotelCost: budgetBreakdown.hotels,
      dailyActivityCost: budgetBreakdown.activities,
      pricePerPerson: budgetBreakdown.packageDetails?.pricePerPerson,
      numberOfPersons: normalizedPersons,
    },
    budgetBreakdown,
  };
}

module.exports = { buildPlan, attachKnownCoordinates };
