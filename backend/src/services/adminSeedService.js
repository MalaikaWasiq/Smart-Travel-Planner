const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const HotelItem = require('../models/HotelItem');
const MenuItem = require('../models/MenuItem');
const ActivityItem = require('../models/ActivityItem');
const CompanyExpense = require('../models/CompanyExpense');

async function seedAdminAndCatalogsIfEmpty() {
  try {
    // 1. Seed Default Administrator if no admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      // Check if admin@gmail.com already exists
      const existingUser = await User.findOne({ email: 'admin@gmail.com' });
      if (existingUser) {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('[adminSeedService] Updated existing admin@gmail.com role to admin.');
      } else {
        const passwordHash = await bcrypt.hash('Admin123!', 12);
        await User.create({
          fullName: 'System Administrator',
          email: 'admin@gmail.com',
          passwordHash,
          role: 'admin',
          preferences: {
            defaultBudget: 150000,
            interests: ['Nature', 'History', 'Adventure'],
            preferredHotelType: 'Luxury',
          },
        });
        console.log('[adminSeedService] Created default administrator: admin@gmail.com (Password: Admin123!)');
      }
    }

    // 2. Seed Vehicles Catalog if empty
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      const defaultVehicles = [
        { vehicleId: 'bike-honda125', name: 'Honda CG 125 / CD 70 Touring Bike', category: 'Motorbike (Solo)', tier: 'Ultra-Low', capacity: '1 Person (Solo)', luggage: '1 Touring Bag / Rucksack', maxPersons: 1, isBike: true, rentPerDay: 1200, fuelPerDay: 800, driverCharges: 0, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'Lightweight, ultra-economical solo travel bike for mountain roads', isAvailable: true },
        { vehicleId: 'bike-ybr125g', name: 'Yamaha YBR 125G / GS 150 Adventure Bike', category: 'Adventure Bike (Solo)', tier: 'Low', capacity: '1 Person (Solo Trail)', luggage: 'Dual Saddlebags & Rucksack', maxPersons: 1, isBike: true, rentPerDay: 1800, fuelPerDay: 1100, driverCharges: 0, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'High ground clearance adventure trail bike for Gilgit, Skardu & Hunza', isAvailable: true },
        { vehicleId: 'bike-adventure250', name: 'Adventure Mountain Trail Bike 150-250cc', category: 'Dual-Sport Adventure', tier: 'Low', capacity: '1 Person (Solo Touring)', luggage: 'Dual Panniers & Top Box', maxPersons: 1, isBike: true, rentPerDay: 2500, fuelPerDay: 1400, driverCharges: 0, billingUnit: 'per_day', icon: 'bicycle-outline', desc: 'High-power dual-sport mountain touring motorbike for high passes', isAvailable: true },
        { vehicleId: 'economy-alto', name: 'Suzuki Alto 660cc / Mehran', category: 'Economy (Budget)', tier: 'Low', capacity: '1 - 3 Persons', luggage: '2 Luggage Bags', maxPersons: 3, rentPerDay: 3000, fuelPerDay: 2000, driverCharges: 1200, billingUnit: 'per_day', icon: 'car-outline', desc: 'Fuel efficient compact budget hatchback', isAvailable: true },
        { vehicleId: 'compact-wagonr', name: 'Suzuki Wagon R / Cultus VXL', category: 'Hatchback (Comfort)', tier: 'Low', capacity: '1 - 4 Persons', luggage: '3 Luggage Bags', maxPersons: 4, rentPerDay: 4000, fuelPerDay: 2500, driverCharges: 1500, billingUnit: 'per_day', icon: 'car-outline', desc: 'Spacious tall-boy hatchback for family touring', isAvailable: true },
        { vehicleId: 'comfort-sedan', name: 'Toyota Corolla GLi / Altis', category: 'Sedan (Auto)', tier: 'Medium', capacity: '3 - 5 Persons', luggage: '4 Luggage Bags', maxPersons: 5, rentPerDay: 6500, fuelPerDay: 3600, driverCharges: 1800, billingUnit: 'per_day', icon: 'car-sport-outline', desc: 'Smooth highway drive, AC sedan with 4 bags boot', isAvailable: true },
        { vehicleId: 'suv-4x4', name: 'Toyota Prado / Mountain 4x4 Jeep', category: '4x4 SUV (Luxury)', tier: 'High', capacity: '4 - 6 Persons', luggage: '6 Luggage Bags', maxPersons: 6, rentPerDay: 14000, fuelPerDay: 6000, driverCharges: 2500, billingUnit: 'per_day', icon: 'trail-sign-outline', desc: 'High ground clearance and power for mountain climbs', isAvailable: true },
        { vehicleId: 'grand-cabin', name: 'Toyota HiAce Grand Cabin VIP', category: 'Van / Luxury Group', tier: 'Group', capacity: '8 - 14 Persons', luggage: '10 Luggage Bags', maxPersons: 14, rentPerDay: 16000, fuelPerDay: 7500, driverCharges: 3000, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Executive high-roof van with dual AC for joint families', isAvailable: true },
        { vehicleId: 'luxury-coaster', name: 'Toyota Coaster Saloon Mini-Bus', category: 'Coaster (Executive)', tier: 'Large Group', capacity: '14 - 24 Persons', luggage: '20 Luggage Bags', maxPersons: 24, rentPerDay: 40000, fuelPerDay: 0, driverCharges: 4000, billingUnit: 'per_day', icon: 'bus-outline', desc: 'Spacious tourist saloon bus with luggage bay', isAvailable: true },
      ];
      await Vehicle.insertMany(defaultVehicles);
      console.log('[adminSeedService] Seeded initial vehicles catalog.');
    }

    // 3. Seed Hotels Catalog if empty
    const hotelCount = await HotelItem.countDocuments();
    if (hotelCount === 0) {
      const defaultHotels = [
        { name: 'Serena Hotel Islamabad', city: 'Islamabad', stars: 5, pricePerNight: 35000, roomTypes: ['Deluxe King', 'Executive Suite'], roomsAvailable: 8, capacityPerRoom: 2, amenities: ['Free WiFi', 'Buffet Breakfast', 'Pool', 'Gym'], isAvailable: true },
        { name: 'Islamabad Marriott Hotel', city: 'Islamabad', stars: 5, pricePerNight: 30000, roomTypes: ['Standard Double', 'Club Room'], roomsAvailable: 12, capacityPerRoom: 2, amenities: ['Free WiFi', 'Breakfast', 'Spa'], isAvailable: true },
        { name: 'Serena Shigar Fort', city: 'Skardu', stars: 5, pricePerNight: 40000, roomTypes: ['Heritage Suite', 'Garden Room'], roomsAvailable: 6, capacityPerRoom: 2, amenities: ['Heritage Tour', 'Restaurant', 'Heating'], isAvailable: true },
        { name: 'Hunza Serena Inn', city: 'Hunza', stars: 4, pricePerNight: 28000, roomTypes: ['Mountain View Deluxe', 'Standard Twin'], roomsAvailable: 10, capacityPerRoom: 2, amenities: ['Rakaposhi View', 'Breakfast', 'WiFi'], isAvailable: true },
        { name: 'Malam Jabba Ski Resort Hotel', city: 'Malam Jabba', stars: 4, pricePerNight: 22000, roomTypes: ['Ski Slope View', 'Alpine Suite'], roomsAvailable: 14, capacityPerRoom: 2, amenities: ['Chairlift Access', 'Heating', 'Balcony'], isAvailable: true },
        { name: 'Pearl Continental Hotel Lahore', city: 'Lahore', stars: 5, pricePerNight: 32000, roomTypes: ['Superior King', 'Executive Floor'], roomsAvailable: 15, capacityPerRoom: 2, amenities: ['Swimming Pool', 'Buffet', 'Valet Parking'], isAvailable: true },
        { name: 'Zaver Pearl Continental Gwadar', city: 'Gwadar', stars: 5, pricePerNight: 26000, roomTypes: ['Ocean View King', 'Executive Suite'], roomsAvailable: 10, capacityPerRoom: 2, amenities: ['Arabian Sea View', 'Seafood Restaurant'], isAvailable: true },
      ];
      await HotelItem.insertMany(defaultHotels);
      console.log('[adminSeedService] Seeded initial hotel items.');
    }

    // 4. Seed Menu Items if empty
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const defaultMenuItems = [
        // Islamabad
        { name: 'Fresh Halwa Puri & Chana Tarkari', city: 'Islamabad', mealCategory: 'breakfast', pricePerServing: 500, description: 'Traditional crispy puri with spiced chana & suji halwa' },
        { name: 'Monal BBQ Platter with Roghani Naan', city: 'Islamabad', mealCategory: 'dinner', pricePerServing: 1800, description: 'Signature chicken seekh kabab, malai boti, reshmi kabab & naan' },
        { name: 'Chicken Karahi with Tandoori Naan', city: 'Islamabad', mealCategory: 'lunch', pricePerServing: 1200, description: 'Fresh desi chicken cooked in tomatoes, ginger and green chillies' },

        // Hunza
        { name: 'Quroot Bread with Apricot Jam & Kernel Oil', city: 'Hunza', mealCategory: 'breakfast', pricePerServing: 600, description: 'Authentic organic Hunza breakfast with local dried curd & apricot oil' },
        { name: 'Chapshuro (Traditional Hunza Meat Pizza)', city: 'Hunza', mealCategory: 'lunch', pricePerServing: 850, description: 'Baked crispy crust stuffed with minced beef, onions and mountain herbs' },
        { name: 'Hunza Trout Fish & Herbal Green Tea', city: 'Hunza', mealCategory: 'dinner', pricePerServing: 1900, description: 'Fresh Kunhar/Hunza river fried trout fish with local mountain tea' },

        // Malam Jabba / Swat
        { name: 'Desi Omelette with Paratha & Doodh Patti Chai', city: 'Malam Jabba', mealCategory: 'breakfast', pricePerServing: 550, description: 'Crispy lachha paratha with spiced desi egg & creamy Karak chai' },
        { name: 'Swati Trout Fish with Fresh Naan', city: 'Malam Jabba', mealCategory: 'lunch', pricePerServing: 1600, description: 'Crispy shallow-fried fresh river trout seasoned with Swati herbs' },
        { name: 'Shinwari Lamb Karahi with Kandahari Naan', city: 'Malam Jabba', mealCategory: 'dinner', pricePerServing: 2200, description: 'Dumba/lamb meat simmered in natural fat, black pepper and fresh green chillies' },

        // Lahore
        { name: 'Old Anarkali Halwa Puri & Lassi', city: 'Lahore', mealCategory: 'breakfast', pricePerServing: 650, description: 'Crispy piping hot puris with sweet suji halwa, sour pickle & sweet lassi' },
        { name: 'Butt Karahi Lakshmi Chowk', city: 'Lahore', mealCategory: 'dinner', pricePerServing: 1950, description: 'World-famous desi ghee chicken karahi from historic food street' },

        // Gwadar / Coastal
        { name: 'Balochi Kaak Bread with Omelette', city: 'Gwadar', mealCategory: 'breakfast', pricePerServing: 550, description: 'Traditional stone-baked crispy Balochi bread with farm fresh eggs' },
        { name: 'Balochi Mutton Sajji with Spiced Rice', city: 'Gwadar', mealCategory: 'dinner', pricePerServing: 2400, description: 'Slow wood-fire roasted whole lamb/chicken seasoned with rock salt' },
      ];
      await MenuItem.insertMany(defaultMenuItems);
      console.log('[adminSeedService] Seeded initial menu items.');
    }

    // 5. Seed Activities Catalog if empty
    const activityCount = await ActivityItem.countDocuments();
    if (activityCount === 0) {
      const defaultActivities = [
        { name: 'Malam Jabba Ski Slope & Chairlift Ride', destination: 'Malam Jabba', category: 'Adventure & Sports', price: 2500, durationHours: 3, description: 'Scenic chairlift ride overlooking snowy mountain peaks with ski gear rental option' },
        { name: 'High-Altitude Mountain Zipline', destination: 'Malam Jabba', category: 'Adventure & Thrill', price: 2000, durationHours: 1, description: 'Thrilling aerial cable ride across the alpine tree canopy of Swat Valley' },
        { name: 'Attabad Lake Jet Ski & Speed Boating', destination: 'Hunza', category: 'Water Sports', price: 3000, durationHours: 2, description: 'Crystal-clear turquoise lake motorboat ride with life jackets' },
        { name: 'Baltit & Altit Forts Guided Heritage Tour', destination: 'Hunza', category: 'Cultural & Heritage', price: 1500, durationHours: 3, description: '800-year-old historic Mir palaces guided tour with mountain photography' },
        { name: 'Upper Kachura Lake Boating & Trout Fishing', destination: 'Skardu', category: 'Nature & Relaxation', price: 2000, durationHours: 3, description: 'Peaceful boat ride surrounded by apricot orchards and high granite cliffs' },
        { name: 'Hammerhead & Marine Promenade Tour', destination: 'Gwadar', category: 'Coastal Exploration', price: 1800, durationHours: 4, description: 'Panoramic cliff views of the Arabian Sea and pristine white-sand beaches' },
        { name: 'Lahore Fort & Badshahi Mosque Heritage Walk', destination: 'Lahore', category: 'Historical & Architectural', price: 1200, durationHours: 3, description: 'UNESCO World Heritage Mughal architecture guided historical walking tour' },
      ];
      await ActivityItem.insertMany(defaultActivities);
      console.log('[adminSeedService] Seeded initial activity items.');
    }

    // 6. Ensure existing trips have valid status and amountPaid
    const tripsWithoutStatus = await Trip.find({
      $or: [{ status: { $exists: false } }, { status: null }, { amountPaid: { $exists: false } }],
    });

    if (tripsWithoutStatus.length > 0) {
      for (const t of tripsWithoutStatus) {
        if (!t.status) t.status = 'Confirmed';
        if (!t.paymentStatus) t.paymentStatus = 'Paid';
        if (!t.amountPaid || t.amountPaid === 0) {
          t.amountPaid = Number(t.budget || t.budgetBreakdown?.totalEstimated || 50000);
        }
        await t.save();
      }
      console.log(`[adminSeedService] Updated ${tripsWithoutStatus.length} existing trips with valid status & payment records.`);
    }

    // 7. Seed initial company expenses from existing trips if CompanyExpense collection is empty
    const expenseCount = await CompanyExpense.countDocuments();
    if (expenseCount === 0) {
      const trips = await Trip.find().limit(15).lean();
      const initialExpenses = [];

      for (const tr of trips) {
        const dest = tr.destination || 'Swat Valley';
        const tripBudget = Number(tr.budget || 60000);

        // Realistic actual company recorded expenses (transport, food, hotels, activities)
        initialExpenses.push(
          {
            tripId: tr._id,
            tripDestination: dest,
            category: 'transport',
            description: `Chauffeur vehicle fuel & motorway toll receipts for trip to ${dest}`,
            amount: Math.round(tripBudget * 0.28),
            date: tr.createdAt || new Date(),
            notes: 'Motorway M-1 / M-16 toll tax slip & verified shell fuel pump invoice',
            recordedBy: 'Admin',
          },
          {
            tripId: tr._id,
            tripDestination: dest,
            category: 'hotels',
            description: `Hotel accommodation billing invoice for ${dest}`,
            amount: Math.round(tripBudget * 0.14),
            date: tr.createdAt || new Date(),
            notes: 'Room reservation & tax invoice verified',
            recordedBy: 'Admin',
          },
          {
            tripId: tr._id,
            tripDestination: dest,
            category: 'food',
            description: `Breakfast & dinner catering expenses for ${dest}`,
            amount: Math.round(tripBudget * 0.30),
            date: tr.createdAt || new Date(),
            notes: 'Daily breakfast & dinner group invoice',
            recordedBy: 'Admin',
          },
          {
            tripId: tr._id,
            tripDestination: dest,
            category: 'activities',
            description: `Sightseeing & entry ticket passes for ${dest}`,
            amount: Math.round(tripBudget * 0.08),
            date: tr.createdAt || new Date(),
            notes: 'National park & chairlift ticket receipts',
            recordedBy: 'Admin',
          }
        );
      }

      if (initialExpenses.length > 0) {
        await CompanyExpense.insertMany(initialExpenses);
        console.log(`[adminSeedService] Seeded ${initialExpenses.length} initial verified expense records.`);
      }
    }
  } catch (err) {
    console.error('[adminSeedService] Error during seeding:', err);
  }
}

module.exports = { seedAdminAndCatalogsIfEmpty };
