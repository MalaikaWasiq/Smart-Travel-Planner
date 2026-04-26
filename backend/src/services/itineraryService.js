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

function generateItinerary({ destination, days, budget, interests = [], forecast = [] }) {
  const city = cityFor(destination);
  const used = { historic: 0, food: 0, nature: 0, shopping: 0, culture: 0 };
  const totalDays = Math.min(Math.max(Number(days) || 1, 1), 14);

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const forecastDay = forecast[index] || {};
    const types = preferredTypesForWeather(forecastDay);

    const activities = types.map((type, activityIndex) => {
      const pool = city[type] || city.historic;
      const place = pool[used[type] % pool.length];
      used[type] += 1;

      return {
        time: timeSlots[activityIndex],
        place,
        type,
        description: `${place} is planned for ${city.name} based on ${interests.length ? interests.join(', ') : 'general travel'} preferences.`,
        estimatedCost: typeCosts[type] || 800,
      };
    });

    return {
      day: index + 1,
      title: dayTitles[index % dayTitles.length],
      weatherNote: forecastDay.advisory || 'Balanced indoor and outdoor planning is suitable.',
      activities,
    };
  });

  return {
    cityName: city.name,
    itinerary,
    budgetBreakdown: buildBudgetBreakdown(itinerary, budget),
  };
}

module.exports = { generateItinerary };
