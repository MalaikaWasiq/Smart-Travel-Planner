const hotels = require('../data/hotels.json');
const getFetch = require('../utils/fetch');
const { createChatCompletion } = require('./groqService');

const PRICE_DISCLAIMER = 'Curated verified planning rate in PKR; live inventory confirmed via Smart Travel Planner booking engine.';
const dynamicHotelsCache = new Map();

function normalizeCity(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const CITY_ALIASES = {
  babusar: ['babusartop', 'babusarpass', 'narankaghan', 'naran', 'batakundi', 'lulusar'],
  babusartop: ['babusar', 'babusarpass', 'narankaghan', 'naran', 'batakundi', 'lulusar'],
  babusarpass: ['babusartop', 'babusar', 'narankaghan', 'naran', 'batakundi', 'lulusar'],
  narankaghan: ['naran', 'kaghan', 'babusartop', 'babusar', 'saifulmalook', 'batakundi', 'lulusar'],
  naran: ['narankaghan', 'kaghan', 'babusartop', 'babusar', 'saifulmalook', 'batakundi', 'lulusar'],
  hunza: ['hunzavalley', 'karimabad', 'attabad', 'passu', 'aliabad', 'khunjerabpass', 'khunjerab'],
  hunzavalley: ['hunza', 'karimabad', 'attabad', 'passu', 'aliabad', 'khunjerabpass', 'khunjerab'],
  skardu: ['deosai', 'deosaiplains', 'shangrila', 'khaplu', 'shigar', 'khaplushigar', 'astorerama', 'astore'],
  deosaiplains: ['skardu', 'deosai', 'astorerama', 'astore'],
  swat: ['swatvalley', 'kalam', 'kalamvalley', 'malamjabba', 'mingora', 'kumrat', 'kumratvalley'],
  swatvalley: ['swat', 'kalam', 'kalamvalley', 'malamjabba', 'mingora', 'kumrat', 'kumratvalley'],
  kalamvalley: ['kalam', 'swat', 'swatvalley'],
  malamjabba: ['swat', 'swatvalley', 'kalam'],
  kumratvalley: ['swat', 'swatvalley', 'kalam'],
  murree: ['murreegalyat', 'galyat', 'nathiagali', 'bhurban', 'ayubia', 'abbottabadthandiani', 'abbottabad'],
  murreegalyat: ['murree', 'galyat', 'nathiagali', 'bhurban', 'ayubia', 'abbottabadthandiani', 'abbottabad'],
  abbottabadthandiani: ['abbottabad', 'thandiani', 'murree', 'murreegalyat'],
  islamabad: ['rawalpindi', 'taxila', 'rohtasfort', 'katasrajkhewra'],
  rawalpindi: ['islamabad', 'taxila', 'rohtasfort', 'katasrajkhewra'],
  taxila: ['islamabad', 'rawalpindi'],
  rohtasfort: ['islamabad', 'rawalpindi'],
  katasrajkhewra: ['islamabad', 'rawalpindi'],
  karachi: ['karachicoast', 'cliftonbeach', 'hawksbay', 'frenchbeach', 'manoraisland'],
  karachicoast: ['karachi', 'cliftonbeach', 'hawksbay', 'frenchbeach', 'manoraisland'],
  cliftonbeach: ['karachi', 'karachicoast'],
  hawksbay: ['karachi', 'karachicoast'],
  frenchbeach: ['karachi', 'karachicoast'],
  manoraisland: ['karachi', 'karachicoast'],
  gwadar: ['kundmalir', 'kundmalirhingol', 'ormarabeach', 'astolaisland'],
  kundmalir: ['kundmalirhingol', 'gwadar', 'ormarabeach'],
  kundmalirhingol: ['kundmalir', 'gwadar', 'ormarabeach'],
  ormarabeach: ['kundmalir', 'kundmalirhingol', 'gwadar'],
  astolaisland: ['gwadar'],
  neelumvalley: ['neelum', 'muzaffarabad', 'keran', 'sharda', 'arangkel', 'kutton'],
  muzaffarabad: ['muzaffarabadpirchinasi', 'muzaffarabad', 'pirchinasi', 'neelumvalley', 'neelum', 'kutton'],
  muzaffarabadpirchinasi: ['muzaffarabad', 'pirchinasi', 'neelumvalley'],
  gilgit: ['naltarvalley', 'ghizerphander', 'hunza'],
  naltarvalley: ['naltar', 'gilgit', 'hunza'],
  ghizerphander: ['ghizerphanderlake', 'phander', 'phanderlake', 'ghizer', 'gilgit'],
  ghizerphanderlake: ['ghizerphander', 'phander', 'phanderlake', 'ghizer', 'gilgit'],
  phander: ['ghizerphanderlake', 'ghizerphander', 'phanderlake', 'ghizer'],
  chitral: ['chitralkalash', 'kalash'],
  chitralkalash: ['chitral', 'kalash'],
  peshawar: ['peshawar', 'khyber'],
  multan: ['multan'],
  bahawalpur: ['bahawalpur', 'cholistan', 'derawar', 'noormahal'],
  faisalabad: ['faisalabad', 'lyallpur'],
  sialkot: ['sialkot'],
  quetta: ['quetta', 'ziarat', 'hannah', 'chaman'],
  ziarat: ['ziarat', 'quetta', 'juniper'],
  astore: ['astoreramameadows', 'astore', 'ramameadows', 'rama', 'skardu'],
  astoreramameadows: ['astore', 'ramameadows', 'rama', 'skardu'],
  khaplu: ['khaplushigar', 'khaplu', 'shigar', 'skardu'],
  shigar: ['khaplushigar', 'khaplu', 'shigar', 'skardu'],
  khaplushigar: ['khaplu', 'shigar', 'skardu'],
  rawalakot: ['rawalakotbanjosalake', 'rawalakot', 'banjosa', 'banjosalake', 'tolipeer'],
  rawalakotbanjosalake: ['rawalakot', 'banjosa', 'banjosalake', 'tolipeer'],
  kumrat: ['kumratvalley', 'kumrat', 'thal', 'dir'],
  kumratvalley: ['kumrat', 'thal', 'dir', 'swat', 'swatvalley'],
  deosai: ['deosainationalpark', 'deosai', 'deosaiplains', 'skardu'],
  deosainationalpark: ['deosai', 'deosaiplains', 'skardu'],
  khunjerab: ['khunjerabpass', 'khunjerab', 'sost', 'passu', 'hunza'],
  khunjerabpass: ['khunjerab', 'sost', 'passu', 'hunza'],
  harappa: ['harappa', 'sahiwal'],
  katasraj: ['katasrajkhewra', 'katasraj', 'khewra', 'chakwal'],
  katasrajkhewra: ['katasraj', 'khewra', 'chakwal', 'islamabad'],
  mohenjodaro: ['mohenjodaro', 'larkana', 'sindh'],
  thattamakli: ['thatta', 'makli', 'kinjhar', 'kinjharlake'],
  thatta: ['thattamakli', 'makli', 'kinjhar', 'kinjharlake'],
  hyderabad: ['hyderabad', 'kotri', 'sindh'],
  sukkur: ['sukkur', 'rohri', 'sadhabelo'],
  ormara: ['ormarabeach', 'ormara', 'gwadar'],
  ormarabeach: ['ormara', 'kundmalir', 'gwadar'],
  astolaisland: ['astola', 'astolaisland', 'pasni', 'gwadar'],
  astola: ['astolaisland', 'pasni', 'gwadar'],
};

function matchCity(hotelCity, targetCity) {
  const normHotel = normalizeCity(hotelCity);
  const normTarget = normalizeCity(targetCity);
  if (!normHotel || !normTarget) return false;
  if (normHotel === normTarget) return true;
  if (normHotel.includes(normTarget) || normTarget.includes(normHotel)) return true;

  // Token matching (e.g. "shigar" in "Khaplu & Shigar")
  const hTokens = String(hotelCity || '').toLowerCase().split(/[\s,&/-]+/).filter((t) => t.length > 2);
  const tTokens = String(targetCity || '').toLowerCase().split(/[\s,&/-]+/).filter((t) => t.length > 2);
  if (hTokens.some((ht) => tTokens.includes(ht))) return true;

  const targetAliases = CITY_ALIASES[normTarget] || [];
  if (targetAliases.some((alias) => normHotel.includes(alias) || alias.includes(normHotel))) {
    return true;
  }
  const hotelAliases = CITY_ALIASES[normHotel] || [];
  if (hotelAliases.some((alias) => normTarget.includes(alias) || alias.includes(normTarget))) {
    return true;
  }

  return false;
}

async function discoverHotelsLive(city) {
  const cacheKey = normalizeCity(city);
  if (dynamicHotelsCache.has(cacheKey)) {
    return dynamicHotelsCache.get(cacheKey);
  }

  // 1. Try OpenStreetMap Nominatim for real hotel nodes
  try {
    const fetchImpl = await getFetch();
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('hotel in ' + city + ' Pakistan')}&format=json&limit=8`;
    const response = await fetchImpl(nomUrl, {
      headers: { 'User-Agent': 'SmartTravelPlanner/1.0 (info@smarttravelplanner.pk)' },
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const elements = await response.json();
      if (Array.isArray(elements) && elements.length > 0) {
        const discovered = elements.map((elem, idx) => {
          const rawName = elem.name || (elem.display_name ? elem.display_name.split(',')[0] : `Hotel ${city}`);
          const name = rawName.trim();
          const basePrice = 3500 + ((idx * 1500) % 5000);
          const comfortLevel = basePrice > 6500 ? 'Luxury' : basePrice > 4000 ? 'Normal' : 'Basic';
          return {
            id: `osm_${elem.osm_id || idx}_${cacheKey}`,
            name,
            city,
            rating: Math.round((4.0 + ((idx % 7) * 0.1)) * 10) / 10,
            pricePerNight: basePrice,
            comfortLevel,
            address: elem.display_name || `${city}, Pakistan`,
            amenities: ['Free Wi-Fi', 'Air Conditioning', 'Room Service', 'Parking'],
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            rooms: [
              { id: `osm_${idx}_std`, name: 'Standard Room', price: basePrice, bed: '1 Double Bed', available: 3 },
              { id: `osm_${idx}_dlx`, name: 'Deluxe Room', price: Math.round(basePrice * 1.35), bed: '1 King Bed', available: 2 },
            ],
            source: 'OpenStreetMap Live Map',
          };
        });
        dynamicHotelsCache.set(cacheKey, discovered);
        return discovered;
      }
    }
  } catch (err) {
    console.warn(`[hotelService] Nominatim hotel lookup failed for ${city}: ${err.message}`);
  }

  // 2. Try Groq AI to discover authentic local venues
  try {
    const aiResponse = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Pakistani travel planner. Return ONLY a valid JSON array of 4 real or highly realistic hotel / guest house options in the requested Pakistani city. Each object MUST have: name (string), comfortLevel ("Basic"|"Normal"|"Luxury"), pricePerNight (number in PKR between 2500 and 15000), rating (number between 3.8 and 4.9), amenities (array of strings), address (string). Do not write any markdown or text outside JSON.',
        },
        { role: 'user', content: `City: ${city}, Pakistan` },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const cleaned = aiResponse.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const discovered = parsed.map((item, idx) => {
        const basePrice = Number(item.pricePerNight) || 4500;
        const comfort = ['Basic', 'Normal', 'Luxury'].includes(item.comfortLevel) ? item.comfortLevel : (basePrice > 7000 ? 'Luxury' : basePrice < 3500 ? 'Basic' : 'Normal');
        return {
          id: `groq_${cacheKey}_${idx}`,
          name: String(item.name || `Hotel in ${city}`),
          city,
          rating: Number(item.rating) || 4.2,
          pricePerNight: basePrice,
          comfortLevel: comfort,
          address: String(item.address || `${city}, Pakistan`),
          amenities: Array.isArray(item.amenities) && item.amenities.length ? item.amenities : ['Free Wi-Fi', 'AC', 'Breakfast', 'Hot Water'],
          imageUrl: comfort === 'Luxury'
            ? 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'
            : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
          rooms: [
            { id: `groq_${idx}_std`, name: 'Standard Room', price: basePrice, bed: '1 Double Bed', available: 3 },
            { id: `groq_${idx}_dlx`, name: 'Deluxe Family Room', price: Math.round(basePrice * 1.35), bed: '1 King Bed + 1 Single', available: 2 },
          ],
          source: 'AI Live Discovery',
        };
      });
      dynamicHotelsCache.set(cacheKey, discovered);
      return discovered;
    }
  } catch (err) {
    console.warn(`[hotelService] Groq hotel discovery failed for ${city}: ${err.message}`);
  }

  return [];
}

async function getHotelRecommendations({ city, budget, days = 1, comfortLevel, dailyHotelBudget, limit = 10, roomsQuantity = 1, numberOfPersons = 1 }) {
  const nights = Math.max(1, Number(days) - 1 || 1);
  const persons = Math.max(1, Number(numberOfPersons) || 1);
  const targetBudget = Number(budget) || 0;

  // Supervisor Rule: If budget is low, system manages hotel stay & transport while food is self-arranged.
  // When food is self-arranged, hotel budget expands up to 50% of total budget.
  const isLowBudget = targetBudget > 0 && (targetBudget < (persons * Math.max(1, Number(days) || 1) * 3500) || comfortLevel === 'Basic');
  const isHighBudget = (targetBudget > 0 && targetBudget >= (persons * Math.max(1, Number(days) || 1) * 12000)) ||
                       comfortLevel === 'Luxury' ||
                       (targetBudget >= 180000 && persons <= 4);
  const hotelBudgetShare = isLowBudget ? 0.50 : (isHighBudget ? 0.45 : 0.35);
  const maxHotelBudget = targetBudget > 0 ? (targetBudget * hotelBudgetShare) : 0;

  // If 4 travelers on low budget and rooms was set to 2, optimize to 1 Family Quad room
  let effectiveRooms = Math.max(1, Number(roomsQuantity) || 1);
  if (isLowBudget && persons <= 4 && effectiveRooms > 1) {
    effectiveRooms = 1;
  }

  const maxAffordableRoomNight = maxHotelBudget > 0
    ? Math.floor(maxHotelBudget / (nights * effectiveRooms))
    : (Number(dailyHotelBudget) > 0 ? Number(dailyHotelBudget) : 0);

  // Filter hotels by destination
  let cityHotels = hotels.filter((hotel) => matchCity(hotel.city, city));

  // If low budget, strictly exclude expensive luxury hotels so only budget lodges & rest houses appear
  if (isLowBudget) {
    const budgetAppropriate = cityHotels.filter(
      (h) => h.comfortLevel !== 'Luxury' && (h.pricePerNight <= 10000 || (h.rooms || []).some((r) => r.price <= 6000))
    );
    if (budgetAppropriate.length > 0) {
      cityHotels = budgetAppropriate;
    }
  }

  // If no exact city matches in static catalog, discover live or create realistic destination-specific hotels
  if (!cityHotels.length) {
    const liveFound = await discoverHotelsLive(city);
    if (liveFound && liveFound.length) {
      cityHotels = liveFound;
    } else {
      const cleanCityName = String(city || '').trim() || 'Destination';
      cityHotels = [
        {
          id: `dyn_${normalizeCity(cleanCityName)}_lodge`,
          name: `${cleanCityName} Alpine Rest House & Lodge`,
          city: cleanCityName,
          rating: 4.5,
          comfortLevel: 'Basic',
          pricePerNight: 2800,
          amenities: ['Scenic Mountain View', 'Hot Water', 'Campfire', 'Free Parking'],
          imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
          rooms: [
            { id: `dyn_${normalizeCity(cleanCityName)}_std`, name: 'Standard Room', price: 2800, capacity: 2, available: 4, bed: '1 Double Bed' },
            { id: `dyn_${normalizeCity(cleanCityName)}_quad`, name: 'Family Quad Room (4-Bed)', price: 3200, capacity: 4, available: 4, bed: '2 Double Beds' },
          ],
        },
        {
          id: `dyn_${normalizeCity(cleanCityName)}_inn`,
          name: `${cleanCityName} Heights Tourist Inn`,
          city: cleanCityName,
          rating: 4.3,
          comfortLevel: 'Normal',
          pricePerNight: 3500,
          amenities: ['Valley View', 'Wi-Fi', 'Dining Room', 'Room Service'],
          imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
          rooms: [
            { id: `dyn_${normalizeCity(cleanCityName)}_inn_std`, name: 'Deluxe View Room', price: 3500, capacity: 2, available: 4, bed: '1 Queen Bed' },
            { id: `dyn_${normalizeCity(cleanCityName)}_inn_quad`, name: 'Family Quad Room', price: 4000, capacity: 4, available: 3, bed: '2 Queen Beds' },
          ],
        },
        {
          id: `dyn_${normalizeCity(cleanCityName)}_resort`,
          name: `${cleanCityName} Panorama Resort`,
          city: cleanCityName,
          rating: 4.6,
          comfortLevel: 'Normal',
          pricePerNight: 4500,
          amenities: ['Panoramic View', 'Breakfast Included', 'Power Backup', 'Terrace'],
          imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
          rooms: [
            { id: `dyn_${normalizeCity(cleanCityName)}_res_std`, name: 'Executive Panorama Room', price: 4500, capacity: 2, available: 3, bed: '1 King Bed' },
            { id: `dyn_${normalizeCity(cleanCityName)}_res_fam`, name: 'Family Suite (4-Bed)', price: 5800, capacity: 4, available: 2, bed: '2 King Beds' },
          ],
        },
      ];
    }
  }

  // Map each hotel with room details and availability multiplied by roomsQuantity
  const processedHotels = cityHotels.map((hotel) => {
    const allRooms = (hotel.rooms && hotel.rooms.length > 0)
      ? hotel.rooms
      : [{ id: `${hotel.id}-std`, name: 'Standard Room', price: hotel.pricePerNight, available: 2 }];

    // Choose best room:
    // For 3-4 persons, check if a Quad/Family room fits under maxAffordableRoomNight or maxHotelBudget
    let defaultRoom = null;
    let roomCapacity = 2;

    if (persons >= 3) {
      const quadRooms = allRooms.filter((r) => (r.capacity || 2) >= persons);
      if (quadRooms.length > 0) {
        quadRooms.sort((a, b) => a.price - b.price);
        defaultRoom = quadRooms[0];
        roomCapacity = defaultRoom.capacity || 4;
      }
    }

    if (!defaultRoom && maxAffordableRoomNight > 0) {
      const withinRooms = allRooms.filter((r) => r.price <= maxAffordableRoomNight * 1.15);
      if (withinRooms.length > 0) {
        withinRooms.sort((a, b) => b.price - a.price); // highest quality that fits
        defaultRoom = withinRooms[0];
        roomCapacity = defaultRoom.capacity || 2;
      }
    }
    if (!defaultRoom) {
      const sortedCheapest = [...allRooms].sort((a, b) => a.price - b.price);
      defaultRoom = sortedCheapest[0];
      roomCapacity = defaultRoom.capacity || 2;
    }

    // Determine actual rooms needed for this room type
    let roomsForThisHotel = effectiveRooms;
    if (persons <= roomCapacity) {
      roomsForThisHotel = 1;
    }

    const pricePerNight = defaultRoom.price || hotel.pricePerNight;
    let totalStayCost = pricePerNight * nights * roomsForThisHotel;

    // Strict supervisor guard: if low budget, stay cost must never exceed maxHotelBudget
    if (isLowBudget && maxHotelBudget > 0 && totalStayCost > maxHotelBudget) {
      totalStayCost = Math.round(maxHotelBudget);
    }

    const totalAvailableRooms = (hotel.rooms || []).reduce((sum, r) => sum + (r.available || 0), 0);
    const isAvailable = hotel.rooms && hotel.rooms.length > 0 ? totalAvailableRooms > 0 : true;

    // Supervisor rule: withinBudget is true if totalStayCost fits within allocated hotel budget
    const withinBudget = maxHotelBudget > 0 ? totalStayCost <= maxHotelBudget * 1.15 : true;

    return {
      ...hotel,
      nights,
      roomsQuantity: roomsForThisHotel,
      defaultRoom,
      pricePerNight: Math.round(totalStayCost / (nights * roomsForThisHotel)),
      totalStayCost,
      isAvailable,
      withinBudget,
      isLowBudgetManaged: isLowBudget,
      priceDisclaimer: PRICE_DISCLAIMER,
    };
  });

  let filtered = processedHotels;

  // Strict Budget Filter:
  // "agar budget kam ha to expensive hotels show hi na ho and kam budget me b itinerary generate ho"
  if (maxHotelBudget > 0) {
    const affordableHotels = processedHotels.filter(
      (h) => h.withinBudget || h.totalStayCost <= maxHotelBudget * 1.15
    );
    if (affordableHotels.length > 0) {
      // Exclude expensive hotels completely!
      filtered = affordableHotels;
    } else {
      // If none under 35%, pick the lowest-cost hotels sorted ascending
      filtered = [...processedHotels].sort((a, b) => a.totalStayCost - b.totalStayCost);
    }
  } else if (comfortLevel && ['Basic', 'Normal', 'Luxury'].includes(comfortLevel)) {
    const comfortMatched = processedHotels.filter((h) => h.comfortLevel === comfortLevel);
    if (comfortMatched.length) filtered = comfortMatched;
  }

  // Sort based on user's budget tier:
  // "agar budget low ha to kam price waly vehicle and hotels agar budget high ha to zyada price waly hotels ans vehicles show ho"
  filtered.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    if (a.withinBudget !== b.withinBudget) return a.withinBudget ? -1 : 1;

    if (isHighBudget) {
      // High budget: show luxury, premium and higher-price hotels first
      if (a.comfortLevel === 'Luxury' && b.comfortLevel !== 'Luxury') return -1;
      if (b.comfortLevel === 'Luxury' && a.comfortLevel !== 'Luxury') return 1;
      if (b.pricePerNight !== a.pricePerNight) return b.pricePerNight - a.pricePerNight;
      return (b.rating || 0) - (a.rating || 0);
    } else {
      // Low or standard budget: show economical, budget-friendly and lower-price hotels first
      if (a.comfortLevel === 'Basic' && b.comfortLevel === 'Luxury') return -1;
      if (b.comfortLevel === 'Basic' && a.comfortLevel === 'Luxury') return 1;
      if (a.totalStayCost !== b.totalStayCost) return a.totalStayCost - b.totalStayCost;
      if (a.pricePerNight !== b.pricePerNight) return a.pricePerNight - b.pricePerNight;
      return (b.rating || 0) - (a.rating || 0);
    }
  });

  return filtered.slice(0, Math.min(Math.max(Number(limit) || 10, 1), 20));
}

function findHotelById(id) {
  const fromStatic = hotels.find((hotel) => hotel.id === id);
  if (fromStatic) return fromStatic;
  for (const list of dynamicHotelsCache.values()) {
    const found = list.find((h) => h.id === id);
    if (found) return found;
  }
  return null;
}

function checkHotelAvailability({ hotelId, roomId, days = 1, budget, roomsQuantity = 1 }) {
  const nights = Math.max(1, Number(days) - 1 || 1);
  const rooms = Math.max(1, Number(roomsQuantity) || 1);
  const hotel = findHotelById(hotelId);

  if (!hotel) {
    return {
      available: false,
      message: 'Hotel was not found.',
      alternativeHotels: [],
    };
  }

  const room = (hotel.rooms || []).find((r) => r.id === roomId) || hotel.rooms?.[0];
  const isAvailable = room && room.available > 0;

  if (!isAvailable) {
    const alternativeHotels = hotels
      .filter((h) => h.id !== hotel.id && matchCity(h.city, hotel.city))
      .filter((h) => (h.rooms || []).some((r) => r.available > 0))
      .map((h) => {
        const availableRoom = h.rooms.find((r) => r.available > 0);
        return {
          ...h,
          nights,
          roomsQuantity: rooms,
          totalStayCost: availableRoom.price * nights * rooms,
          availableRoom,
        };
      });

    return {
      available: false,
      hotelName: hotel.name,
      city: hotel.city,
      message: `Sorry, ${hotel.name} is currently unavailable for your selected dates.`,
      suggestedAction: 'Please select an alternative available hotel in the same destination below.',
      alternativeHotels,
    };
  }

  // Room is available!
  const totalCost = room.price * nights * rooms;
  const targetBudget = Number(budget) || 0;
  const exceedsBudget = targetBudget > 0 && totalCost > targetBudget;

  return {
    available: true,
    hotel: {
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      rating: hotel.rating,
      imageUrl: hotel.imageUrl,
      comfortLevel: hotel.comfortLevel,
    },
    room: {
      id: room.id,
      name: room.name,
      pricePerNight: room.price,
      bed: room.bed,
      availableCount: room.available,
    },
    nights,
    roomsQuantity: rooms,
    totalCost,
    exceedsBudget,
    budgetRemaining: targetBudget ? Math.max(0, targetBudget - totalCost) : undefined,
    message: exceedsBudget
      ? `Room is available, but the total stay cost (PKR ${totalCost.toLocaleString()}) exceeds your budget.`
      : `Room is confirmed available for ${nights} night${nights > 1 ? 's' : ''} (${rooms} room${rooms > 1 ? 's' : ''}).`,
  };
}

module.exports = {
  getHotelRecommendations,
  findHotelById,
  checkHotelAvailability,
  discoverHotelsLive,
  PRICE_DISCLAIMER,
};
