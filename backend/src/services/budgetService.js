const { calculateActualFoodExpense, getMenuForDestination } = require('./foodService');

function round(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

// Vehicle Catalog matching client's Pakistani vehicle options with explicit billing units
const VEHICLES = [
  // Solo & Adventure Touring Bikes
  { id: 'bike-honda125', name: 'Honda CG 125 / CD 70 Touring Bike', category: 'Motorbike (Solo)', tier: 'Ultra-Low', capacity: '1 Person (Solo)', luggage: '1 Touring Bag / Rucksack', maxPersons: 1, isBike: true, rentPerDay: 1200, fuelPerDay: 800, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'Lightweight, ultra-economical solo travel bike for mountain roads' },
  { id: 'bike-ybr125g', name: 'Yamaha YBR 125G / GS 150 Adventure Bike', category: 'Adventure Bike (Solo)', tier: 'Low', capacity: '1 Person (Solo Trail)', luggage: 'Dual Saddlebags & Rucksack', maxPersons: 1, isBike: true, rentPerDay: 1800, fuelPerDay: 1100, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'High ground clearance adventure trail bike for Gilgit, Skardu & Hunza' },
  { id: 'bike-adventure250', name: 'Adventure Mountain Trail Bike 150-250cc', category: 'Dual-Sport Adventure', tier: 'Low', capacity: '1 Person (Solo Touring)', luggage: 'Dual Panniers & Top Box', maxPersons: 1, isBike: true, rentPerDay: 2500, fuelPerDay: 1400, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'High-power dual-sport mountain touring motorbike for high passes' },

  // Cars & Passenger Vehicles
  { id: 'economy-alto', name: 'Suzuki Alto 660cc / Mehran', category: 'Economy (Budget)', tier: 'Low', capacity: '1 - 3 Persons', luggage: '2 Luggage Bags', maxPersons: 3, rentPerDay: 3000, fuelPerDay: 2000, billingUnit: 'per_day', icon: 'car-outline', desc: 'Fuel efficient compact budget hatchback' },
  { id: 'economy-mira', name: 'Daihatsu Mira / Suzuki Every', category: 'Economy (Mini MPV)', tier: 'Low', capacity: '1 - 4 Persons', luggage: '3 Luggage Bags', maxPersons: 4, rentPerDay: 3800, fuelPerDay: 2200, billingUnit: 'per_day', icon: 'car-outline', desc: 'Economical Japanese Kei car / mini MPV' },
  { id: 'compact-wagonr', name: 'Suzuki Wagon R / Cultus VXL', category: 'Hatchback (Comfort)', tier: 'Low', capacity: '1 - 4 Persons', luggage: '3 Luggage Bags', maxPersons: 4, rentPerDay: 4000, fuelPerDay: 2500, billingUnit: 'per_day', icon: 'car-outline', desc: 'Spacious tall-boy hatchback' },
  { id: 'compact-vitz', name: 'Toyota Vitz / Yaris 1.3L', category: 'Hatchback / Compact', tier: 'Medium-Low', capacity: '1 - 4 Persons', luggage: '3 Luggage Bags', maxPersons: 4, rentPerDay: 4800, fuelPerDay: 2800, billingUnit: 'per_day', icon: 'car-outline', desc: 'Modern reliable compact car' },
  { id: 'sedan-city', name: 'Honda City 1.3L / 1.5L', category: 'Sedan (Economy)', tier: 'Medium', capacity: '3 - 5 Persons', luggage: '4 Luggage Bags', maxPersons: 5, rentPerDay: 5500, fuelPerDay: 3200, billingUnit: 'per_day', icon: 'car-sport-outline', desc: 'Smooth city & highway comfortable sedan' },
  { id: 'comfort-sedan', name: 'Toyota Corolla GLi / Altis', category: 'Sedan (Auto)', tier: 'Medium', capacity: '3 - 5 Persons', luggage: '4 Luggage Bags', maxPersons: 5, rentPerDay: 6500, fuelPerDay: 3600, billingUnit: 'per_day', icon: 'car-sport-outline', desc: 'Smooth highway drive, AC sedan with 4 bags boot' },
  { id: 'sedan-civic', name: 'Honda Civic Oriel 1.8L', category: 'Sedan (Executive)', tier: 'Medium-High', capacity: '3 - 5 Persons', luggage: '4 Luggage Bags', maxPersons: 5, rentPerDay: 7500, fuelPerDay: 4000, billingUnit: 'per_day', icon: 'car-sport-outline', desc: 'Executive premium sedan' },
  { id: 'mpv-karvaan', name: 'Changan Karvaan Plus MPV', category: 'MPV (Budget Van)', tier: 'Medium', capacity: '4 - 7 Persons', luggage: '5 Luggage Bags', maxPersons: 7, rentPerDay: 8000, fuelPerDay: 4200, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Affordable 7-seater passenger MPV' },
  { id: 'family-brv', name: 'Honda BR-V 7-Seater MPV', category: 'Family MPV (7-Seater)', tier: 'Medium-High', capacity: '4 - 6 Persons', luggage: '5 Luggage Bags', maxPersons: 6, rentPerDay: 8800, fuelPerDay: 4600, billingUnit: 'per_day', icon: 'car-sport-outline', desc: 'Versatile 7-seater MPV for family & luggage' },
  { id: 'suv-sportage', name: 'KIA Sportage / Tucson AWD', category: 'Compact SUV', tier: 'High', capacity: '4 - 5 Persons', luggage: '5 Luggage Bags', maxPersons: 5, rentPerDay: 11000, fuelPerDay: 5200, billingUnit: 'per_day', icon: 'trail-sign-outline', desc: 'Modern AWD compact crossover' },
  { id: 'suv-fortuner', name: 'Toyota Fortuner / Revo 4x4', category: 'Full SUV 4x4', tier: 'High', capacity: '4 - 7 Persons', luggage: '6 Luggage Bags', maxPersons: 7, rentPerDay: 13000, fuelPerDay: 5800, billingUnit: 'per_day', icon: 'trail-sign-outline', desc: 'Heavy duty 4x4 SUV for extreme mountain trails' },
  { id: 'suv-4x4', name: 'Toyota Prado / Mountain 4x4 Jeep', category: '4x4 SUV (Luxury)', tier: 'High', capacity: '4 - 6 Persons', luggage: '6 Luggage Bags', maxPersons: 6, rentPerDay: 14000, fuelPerDay: 6000, billingUnit: 'per_day', icon: 'trail-sign-outline', desc: 'High ground clearance and power for mountain climbs' },
  { id: 'van-hiace', name: 'Toyota HiAce Standard Commuter', category: 'Van / Group', tier: 'Group', capacity: '7 - 11 Persons', luggage: '8 Luggage Bags', maxPersons: 11, rentPerDay: 13500, fuelPerDay: 6500, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Standard high-roof passenger van' },
  { id: 'grand-cabin', name: 'Toyota HiAce Grand Cabin VIP', category: 'Van / Luxury Group', tier: 'Group', capacity: '8 - 14 Persons', luggage: '10 Luggage Bags', maxPersons: 14, rentPerDay: 16000, fuelPerDay: 7500, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Executive high-roof van with dual AC for joint families' },
  { id: 'luxury-coaster', name: 'Toyota Coaster Saloon Mini-Bus', category: 'Coaster (Executive)', tier: 'Large Group', capacity: '14 - 24 Persons', luggage: '20 Luggage Bags', maxPersons: 24, rentPerDay: 40000, fuelPerDay: 0, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Spacious tourist saloon bus with luggage bay' },
];

function selectVehicleForGroup(numPersons, preferredVehicleId) {
  const count = Math.max(1, Number(numPersons) || 1);

  if (preferredVehicleId) {
    const norm = String(preferredVehicleId).toLowerCase().trim();
    // 1. Exact ID match
    const exact = VEHICLES.find((v) => v.id.toLowerCase() === norm && v.maxPersons >= count);
    if (exact) return exact;

    // 2. Keyword & name matching
    const found = VEHICLES.find((v) =>
      (v.tier.toLowerCase() === norm ||
      v.category.toLowerCase().includes(norm) ||
      v.name.toLowerCase().includes(norm) ||
      (norm.includes('mehran') && v.id === 'economy-alto') ||
      (norm.includes('alto') && v.id === 'economy-alto') ||
      (norm.includes('wagon') && v.id === 'compact-wagonr') ||
      (norm.includes('corolla') && v.id === 'comfort-sedan') ||
      (norm.includes('civic') && v.id === 'sedan-civic') ||
      (norm.includes('brv') && v.id === 'family-brv') ||
      (norm.includes('br-v') && v.id === 'family-brv') ||
      (norm.includes('prado') && v.id === 'suv-4x4') ||
      (norm.includes('jeep') && v.id === 'suv-4x4') ||
      (norm.includes('hiace') && (v.id === 'grand-cabin' || v.id === 'van-hiace')) ||
      (norm.includes('coaster') && v.id === 'luxury-coaster') ||
      (norm.includes('ybr') && v.id === 'bike-ybr125g') ||
      (norm.includes('honda') && v.id === 'bike-honda125') ||
      (norm.includes('250') && v.id === 'bike-adventure250') ||
      (norm.includes('bike') && v.id === 'bike-ybr125g')) &&
      v.maxPersons >= count
    );
    if (found) return found;
  }

  // Automatic safe vehicle matching by seating capacity
  if (count <= 3) return VEHICLES.find((v) => v.id === 'economy-alto') || VEHICLES[0];
  if (count <= 4) return VEHICLES.find((v) => v.id === 'compact-wagonr') || VEHICLES[2];
  if (count <= 5) return VEHICLES.find((v) => v.id === 'comfort-sedan') || VEHICLES[5];
  if (count <= 7) return VEHICLES.find((v) => v.id === 'mpv-karvaan') || VEHICLES[7];
  if (count <= 14) return VEHICLES.find((v) => v.id === 'grand-cabin') || VEHICLES[13];
  return VEHICLES.find((v) => v.id === 'luxury-coaster') || VEHICLES[VEHICLES.length - 1];
}

function calculateBudgetAllocation(totalBudget, isLowBudget = false, isCompany = false) {
  const total = round(totalBudget);
  if (isCompany) {
    const profit = round(total * 0.10);
    const safety = round(total * 0.05);
    return {
      transport: round(total * 0.35),
      hotels: round(total * 0.15),
      food: round(total * 0.35),
      activities: round(total * 0.10),
      companyProfit: profit,
      safetyMargin: safety,
      total,
      isLowBudget,
      isCompany: true,
    };
  }

  // Customized Mode: Direct traveler allocation (35% Transport, 35% Food, 15% Hotel, 15% Activities)
  return {
    transport: round(total * 0.35),
    hotels: round(total * 0.15),
    food: round(total * 0.35),
    activities: round(total * 0.15),
    safetyMargin: 0,
    companyProfit: 0,
    total,
    isLowBudget,
    isCompany: false,
  };
}

function calculateBudget({
  budget,
  budgetPerPerson,
  numberOfPersons = 1,
  days = 1,
  itinerary = [],
  destination = 'Islamabad',
  route,
  selectedHotel,
  hotelPricePerNight,
  hotelSuggestions = [],
  expenses = [],
  vehicleType,
  driverRequired = false,
  tripMode = 'customized',
  transportChoice = 'rental',
  foodChoice = 'included',
  hotelRequired = true,
  transportRequired = true,
  foodRequired = true,
  activitiesRequired = true,
  selectedActivities = [],
  optionalActivities = [],
  roomsQuantity = 1,
  nights: passedNights,
  selectedMeals = { breakfast: true, lunch: false, dinner: true },
  selectedFoodItems = {},
  optionalExperiences = [],
}) {
  const normalizedPersons = Math.max(1, Number(numberOfPersons) || 1);
  const normalizedDays = Math.max(1, Number(days) || 1);
  const nights = Math.max(1, passedNights ? Number(passedNights) : (normalizedDays > 1 ? normalizedDays - 1 : 1));

  // Target Budget
  const normalizedBudget = round(
    budget || (Number(budgetPerPerson) ? Number(budgetPerPerson) * normalizedPersons : 38500 * normalizedPersons)
  );
  const perPersonTarget = round(normalizedBudget / normalizedPersons);

  const isCompany = tripMode === 'company';
  const isTransportNeeded = Boolean(transportRequired !== false);
  const isHotelNeeded = Boolean(hotelRequired !== false);
  const isFoodNeeded = Boolean(foodRequired !== false && foodChoice !== 'self');
  const isActivitiesNeeded = Boolean(activitiesRequired !== false);
  const isOwnCar = !isCompany && isTransportNeeded && transportChoice === 'own';

  // Room Calculation: 20 persons, 2 per room = 10 rooms (Ceil division using room capacity)
  const roomCapacity = selectedHotel?.selectedRoom?.capacity || selectedHotel?.rooms?.[0]?.capacity || 2;
  const calculatedRooms = Math.ceil(normalizedPersons / roomCapacity);
  const effectiveRooms = Math.max(1, roomsQuantity ? Number(roomsQuantity) : calculatedRooms);

  // 1. TRANSPORTATION CALCULATION (Priority 1)
  const vehicle = selectVehicleForGroup(normalizedPersons, vehicleType);
  let transport = 0;
  let transportRent = 0;
  let transportDriver = 0;
  let transportFuel = 0;
  let transportTolls = 0;

  if (!isTransportNeeded) {
    transport = 0;
  } else if (isOwnCar) {
    // Using own car: zero rental charge
    transport = 0;
  } else {
    // Rental vehicle based on billing unit (rentPerDay * normalizedDays)
    transportRent = round(vehicle.rentPerDay * normalizedDays);
    transportDriver = driverRequired ? round(2000 * normalizedDays) : 0;
    transportFuel = 0; // Fuel included in tour package / standard rental
    transportTolls = 0;
    transport = transportRent + transportDriver + transportFuel + transportTolls;
  }

  // Budget remaining after transportation
  const remainingAfterTransport = normalizedBudget - transport;
  const maxAffordableDaysForVehicle = vehicle.rentPerDay > 0 ? Math.floor(normalizedBudget / vehicle.rentPerDay) : normalizedDays;
  const canAffordTransport = remainingAfterTransport >= 0;

  // 2. HOTEL CALCULATION (Priority 2, directly following Transport)
  let hotels = 0;
  let hotel = null;
  let roomPricePerNight = 3200;

  if (isHotelNeeded) {
    hotel = selectedHotel || hotelSuggestions.find((h) => h.withinBudget) || hotelSuggestions[0];
    roomPricePerNight = hotelPricePerNight ? round(hotelPricePerNight) : (hotel ? round(hotel.selectedRoom?.price || hotel.defaultRoom?.price || hotel.pricePerNight || 3200) : 3200);
    hotels = round(roomPricePerNight * nights * effectiveRooms);
  } else {
    hotels = 0;
  }

  const remainingAfterHotel = remainingAfterTransport - hotels;
  const canAffordHotel = remainingAfterTransport >= hotels;
  const hotelBudgetShortfall = Math.max(0, hotels - remainingAfterTransport);

  // 3. FOOD CALCULATION (Priority 3, directly following Hotel)
  let food = 0;
  let foodResult = { totalCost: 0, breakdown: {}, isSelfManaged: true };

  if (isFoodNeeded) {
    foodResult = calculateActualFoodExpense({
      destination,
      numberOfPersons: normalizedPersons,
      days: normalizedDays,
      foodRequired: true,
      foodChoice: 'included',
      selectedMeals,
      selectedFoodItems,
    });
    food = foodResult.totalCost;
  } else {
    food = 0;
    foodResult = calculateActualFoodExpense({
      destination,
      numberOfPersons: normalizedPersons,
      days: normalizedDays,
      foodRequired: false,
      foodChoice: 'self',
    });
  }

  const remainingAfterFood = remainingAfterHotel - food;
  const canAffordFood = remainingAfterHotel >= food;
  const foodBudgetShortfall = Math.max(0, food - remainingAfterHotel);

  // 4. ACTIVITIES CALCULATION (Priority 4, directly following Food)
  let activities = 0;
  let activeActivitiesList = [];

  if (isActivitiesNeeded) {
    const list = Array.isArray(selectedActivities) && selectedActivities.length > 0
      ? selectedActivities
      : (Array.isArray(optionalActivities) ? optionalActivities : []);

    activities = list.reduce((sum, act) => {
      const price = round(act.pricePerPerson ? act.pricePerPerson * normalizedPersons : (act.price || act.cost || 0));
      return sum + price;
    }, 0);

    activeActivitiesList = list.map((act) => ({
      name: act.name || act.title || 'Activity',
      cost: round(act.pricePerPerson ? act.pricePerPerson * normalizedPersons : (act.price || act.cost || 0)),
    }));
  } else {
    activities = 0;
  }

  const remainingAfterActivities = remainingAfterFood - activities;
  const canAffordActivities = remainingAfterFood >= activities;

  // 5. OPTIONAL EXTRA EXPERIENCES (Priority 5: "Make Your Trip More Special!")
  // Shown & deducted only when remaining budget > 0
  let optionalCost = 0;
  let selectedExtrasList = [];

  const extrasSource = Array.isArray(optionalExperiences) && optionalExperiences.length > 0
    ? optionalExperiences
    : (Array.isArray(optionalActivities) ? optionalActivities.filter(opt => opt.isExtra || (opt.id && String(opt.id).startsWith('extra_')) || (opt.name && (opt.name.toLowerCase().includes('bonfire') || opt.name.toLowerCase().includes('bbq')))) : []);

  extrasSource.forEach((opt) => {
    if (opt.selected !== false) {
      const cost = round(opt.cost || opt.price || 0);
      if (cost > 0) {
        optionalCost += cost;
        selectedExtrasList.push({
          id: opt.id,
          name: opt.name || 'Extra Experience',
          cost,
        });
      }
    }
  });

  const remainingAfterOptional = remainingAfterActivities - optionalCost;

  // Company Profit & Safety Contingency (Company Mode only)
  const companyProfit = isCompany ? round(normalizedBudget * 0.10) : 0;
  const safetyMargin = isCompany ? round(normalizedBudget * 0.05) : 0;

  // Total Incurred
  const totalActualExpenses = transport + hotels + food + activities + optionalCost + companyProfit + safetyMargin;
  const remainingBudget = Math.max(0, normalizedBudget - totalActualExpenses);
  const remainingPerPerson = Math.round(remainingBudget / normalizedPersons);
  const percentUsed = normalizedBudget > 0 ? Math.min(100, Math.round((totalActualExpenses / normalizedBudget) * 100)) : 100;
  const exceeded = totalActualExpenses > normalizedBudget && normalizedBudget > 0;
  const overBy = Math.max(0, totalActualExpenses - normalizedBudget);

  const allocation = calculateBudgetAllocation(normalizedBudget, false, isCompany);

  // Build dynamic package inclusions based ONLY on services selected
  const dynamicInclusions = [];
  if (isTransportNeeded && vehicle) {
    dynamicInclusions.push(`Dedicated ${vehicle.name} (${vehicle.billingUnit}) with fuel & driver`);
  }
  if (isHotelNeeded && hotel) {
    dynamicInclusions.push(`${nights} Nights Hotel Stay at ${hotel.name || 'Verified Hotel'} (${effectiveRooms} Room${effectiveRooms > 1 ? 's' : ''})`);
  }
  if (isFoodNeeded) {
    dynamicInclusions.push(`Daily Meals Plan (${foodResult.menuTitle})`);
  }
  if (activeActivitiesList.length > 0) {
    dynamicInclusions.push(`${activeActivitiesList.length} Selected Activities & Sightseeing Passes`);
  }
  if (selectedExtrasList && selectedExtrasList.length > 0) {
    selectedExtrasList.forEach((extra) => {
      dynamicInclusions.push(`✨ ${extra.name || extra.title || 'Special Experience'}`);
    });
  }
  dynamicInclusions.push('24/7 Smart Travel Planner Helpline & Coordination');

  return {
    totalBudget: normalizedBudget,
    budgetPerPerson: perPersonTarget,
    numberOfPersons: normalizedPersons,
    days: normalizedDays,
    nights,
    roomsQuantity: effectiveRooms,
    destination,

    // Actual Expenses
    transport,
    hotels,
    food,
    activities,
    optionalExperiences: optionalCost,
    companyProfit,
    safetyMargin,
    totalEstimated: totalActualExpenses,
    remaining: remainingBudget,
    remainingPerPerson,
    percentUsed,
    exceeded,
    overBy,

    // Service Breakdown Objects
    transportBreakdown: {
      vehicle,
      rent: transportRent,
      driver: transportDriver,
      fuel: transportFuel,
      tolls: transportTolls,
      total: transport,
    },
    foodPlan: {
      total: food,
      isSelfManaged: !isFoodNeeded,
      cityName: foodResult.cityName,
      menuTitle: foodResult.menuTitle,
      breakdown: foodResult.breakdown,
    },
    hotelDetails: {
      hotel,
      roomsQuantity: effectiveRooms,
      roomPricePerNight,
      nights,
      total: hotels,
    },
    activitiesList: activeActivitiesList,
    selectedExtras: selectedExtrasList,

    // Service Adjustment & Affordability Flags for UI
    canAffordTransport,
    maxAffordableDaysForVehicle,
    canAffordFood,
    foodBudgetShortfall,
    canAffordHotel,
    hotelBudgetShortfall,

    // Allocation Guide
    allocation,

    // Summary description
    packageDetails: {
      summary: `${normalizedDays}-Day ${destination} Journey for ${normalizedPersons} Persons`,
      vehicle: isTransportNeeded ? `${vehicle.name} (${vehicle.billingUnit})` : 'Self-Drive / None',
      hotel: isHotelNeeded ? `${hotel?.name || 'Standard Hotel'} (${effectiveRooms} Rooms x ${nights} Nights)` : 'Self-Managed Accommodation (PKR 0)',
      food: isFoodNeeded ? `${foodResult.menuTitle} (PKR ${food.toLocaleString()})` : 'Self-Arranged Food (PKR 0)',
      activities: `${activeActivitiesList.length} Selected Activities`,
      inclusions: dynamicInclusions,
    },
  };
}

module.exports = {
  calculateBudget,
  calculateBudgetAllocation,
  selectVehicleForGroup,
  VEHICLES,
};
