const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const HotelItem = require('../models/HotelItem');
const MenuItem = require('../models/MenuItem');
const ActivityItem = require('../models/ActivityItem');
const CompanyExpense = require('../models/CompanyExpense');
const httpError = require('../utils/httpError');

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTripTotal(trip) {
  if (!trip) return 0;
  if (typeof trip.budget === 'number' && trip.budget > 0) return trip.budget;
  if (trip.budgetBreakdown?.totalEstimated) return Number(trip.budgetBreakdown.totalEstimated);
  if (trip.budget?.estimatedTotal) return Number(trip.budget.estimatedTotal);
  if (trip.budget?.totalCost) return Number(trip.budget.totalCost);
  return 0;
}

function getTripBreakdown(trip) {
  if (!trip) return { transport: 0, food: 0, hotel: 0, activities: 0 };
  const b = trip.budgetBreakdown || (typeof trip.budget === 'object' ? trip.budget?.breakdown : {}) || {};
  const trans = Number(b.transportation || b.transport || 0);
  const food = Number(b.food || 0);
  const hotel = Number(b.accommodation || b.hotels || b.hotel || 0);
  const act = Number(b.activities || b.activity || 0);
  if (trans || food || hotel || act) {
    return { transport: trans, food, hotel, activities: act };
  }
  const total = getTripTotal(trip);
  return {
    transport: Math.round(total * 0.35),
    food: Math.round(total * 0.35),
    hotel: Math.round(total * 0.15),
    activities: Math.round(total * 0.10),
  };
}

// Helper: Calculate dashboard KPIs and graphs
async function getDashboardStats(req, res, next) {
  try {
    const [trips, users, expenses] = await Promise.all([
      Trip.find().lean(),
      User.find().lean(),
      CompanyExpense.find().lean(),
    ]);

    const totalTrips = trips.length;
    const totalCustomers = users.filter((u) => u.role !== 'admin').length;
    const customersWithTrips = new Set(trips.map((t) => t.userId?.toString()).filter(Boolean)).size;

    // Financial calculations
    let totalRevenue = 0;
    let actualTransportCost = 0;
    let actualFoodCost = 0;
    let actualHotelCost = 0;
    let actualActivityCost = 0;

    trips.forEach((trip) => {
      const est = getTripTotal(trip);
      totalRevenue += est;

      const breakdown = getTripBreakdown(trip);
      actualTransportCost += breakdown.transport;
      actualFoodCost += breakdown.food;
      actualHotelCost += breakdown.hotel;
      actualActivityCost += breakdown.activities;
    });

    // Expenses from CompanyExpense records
    let recordedExpenses = 0;
    expenses.forEach((exp) => {
      recordedExpenses += Number(exp.amount) || 0;
    });

    // If recordedExpenses is less than trip operational costs, compute comprehensive company expenses
    const operationalTripExpenses = (actualTransportCost + actualFoodCost + actualHotelCost + actualActivityCost) * 0.90; // 90% direct vendor costs
    const totalCompanyExpenses = Math.max(recordedExpenses, operationalTripExpenses);
    const companyProfit = Math.max(0, totalRevenue - totalCompanyExpenses);
    const profitMargin = totalRevenue > 0 ? ((companyProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Upcoming trips count
    const now = new Date();
    const upcomingTrips = trips.filter((t) => {
      if (t.status === 'Upcoming' || t.status === 'Confirmed') return true;
      if (t.startDate) {
        const start = new Date(t.startDate);
        return start >= now && t.status !== 'Cancelled';
      }
      return false;
    }).length;

    // Monthly Performance (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = now.getMonth();
    const monthlyPerformance = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), currentMonthIdx - i, 1);
      const mName = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Sum trips created in this month
      const monthTrips = trips.filter((t) => {
        const createdAt = t.createdAt ? new Date(t.createdAt) : null;
        if (!createdAt) return false;
        return createdAt.getFullYear() === year && createdAt.getMonth() === d.getMonth();
      });

      const mRevenue = monthTrips.reduce((sum, t) => sum + getTripTotal(t), 0);
      const mTripCost = monthTrips.reduce((sum, t) => {
        const b = getTripBreakdown(t);
        return sum + b.transport + b.food + b.hotel + b.activities;
      }, 0);
      
      const mRecordedExpenses = expenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getFullYear() === year && ed.getMonth() === d.getMonth();
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const mExpenses = Math.max(mRecordedExpenses, mTripCost * 0.88);
      const mProfit = Math.max(0, mRevenue - mExpenses);

      monthlyPerformance.push({
        month: mName,
        monthKey,
        tripsCount: monthTrips.length,
        revenue: Math.round(mRevenue),
        expenses: Math.round(mExpenses),
        profit: Math.round(mProfit),
      });
    }

    // Budget Allocation Targets vs Actual
    // Targets: Transport 35%, Food 35%, Hotel 15%, Activities 10%, Reserve 5%
    const totalActualCosts = actualTransportCost + actualFoodCost + actualHotelCost + actualActivityCost;
    const budgetAllocation = {
      targets: [
        { category: 'Transport', label: 'Transportation', percentage: 35, color: '#15803d' },
        { category: 'Food', label: 'Food & Meals', percentage: 35, color: '#0ea5e9' },
        { category: 'Hotel', label: 'Hotel & Stay', percentage: 15, color: '#d97706' },
        { category: 'Activities', label: 'Activities & Sightseeing', percentage: 10, color: '#8b5cf6' },
        { category: 'Reserve', label: 'Unallocated / Reserve', percentage: 5, color: '#64748b' },
      ],
      actual: {
        transport: Math.round(actualTransportCost),
        food: Math.round(actualFoodCost),
        hotel: Math.round(actualHotelCost),
        activities: Math.round(actualActivityCost),
        totalDirectCost: Math.round(totalActualCosts),
        reserve: Math.round(totalRevenue * 0.05),
      },
    };

    // Popular Destinations count
    const destMap = {};
    trips.forEach((t) => {
      const dest = t.destination || t.destinationCity || 'Other';
      destMap[dest] = (destMap[dest] || 0) + 1;
    });
    const popularDestinations = Object.entries(destMap)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Booking Status Distribution
    const statusMap = {
      Confirmed: 0,
      Upcoming: 0,
      'In Progress': 0,
      Completed: 0,
      Pending: 0,
      Cancelled: 0,
    };
    trips.forEach((t) => {
      const st = t.status || 'Pending';
      if (statusMap[st] !== undefined) {
        statusMap[st]++;
      } else {
        statusMap.Pending++;
      }
    });

    res.json({
      kpis: {
        totalTrips,
        totalCustomers,
        customersWithTrips,
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalCompanyExpenses),
        companyProfit: Math.round(companyProfit),
        profitMargin,
        upcomingTrips,
      },
      monthlyPerformance,
      budgetAllocation,
      popularDestinations,
      statusDistribution: statusMap,
    });
  } catch (error) {
    next(error);
  }
}

// 2. Budget Allocation Details
async function getBudgetAllocation(req, res, next) {
  try {
    const trips = await Trip.find().lean();
    let totalRevenue = 0;
    let transportActual = 0;
    let foodActual = 0;
    let hotelActual = 0;
    let activitiesActual = 0;

    const tripsBudgetList = trips.map((t) => {
      const est = getTripTotal(t);
      totalRevenue += est;
      const bd = getTripBreakdown(t);

      transportActual += bd.transport;
      foodActual += bd.food;
      hotelActual += bd.hotel;
      activitiesActual += bd.activities;

      return {
        id: t._id,
        title: t.title || `${t.destination} Trip`,
        destination: t.destination,
        totalBudget: est,
        breakdown: {
          transport: bd.transport,
          food: bd.food,
          hotel: bd.hotel,
          activities: bd.activities,
          reserve: Math.round(est * 0.05),
        },
        status: t.status || 'Pending',
        createdAt: t.createdAt,
      };
    });

    res.json({
      targets: {
        transportation: 35,
        food: 35,
        hotelStay: 15,
        activities: 10,
        unallocatedReserve: 5,
      },
      overall: {
        totalRevenue: Math.round(totalRevenue),
        transportActual: Math.round(transportActual),
        foodActual: Math.round(foodActual),
        hotelActual: Math.round(hotelActual),
        activitiesActual: Math.round(activitiesActual),
        reserveTarget: Math.round(totalRevenue * 0.05),
      },
      tripsBudgetList: tripsBudgetList.slice(0, 30),
    });
  } catch (error) {
    next(error);
  }
}

// 3. Trips Management
async function getTrips(req, res, next) {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      const safeSearch = escapeRegex(String(search).trim());
      filter.$or = [
        { destination: { $regex: safeSearch, $options: 'i' } },
        { title: { $regex: safeSearch, $options: 'i' } },
        { departureLocation: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const total = await Trip.countDocuments(filter);
    const trips = await Trip.find(filter)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      trips: trips.map((t) => ({
        id: t._id,
        title: t.title,
        destination: t.destination,
        departureLocation: t.departureLocation || 'Islamabad',
        startDate: t.startDate,
        endDate: t.endDate,
        durationDays: t.durationDays || 3,
        passengers: t.passengers || 1,
        totalCost: getTripTotal(t),
        status: t.status || 'Pending',
        paymentStatus: t.paymentStatus || 'Pending',
        amountPaid: t.amountPaid || 0,
        customerName: t.userId?.fullName || 'Guest Customer',
        customerEmail: t.userId?.email || 'N/A',
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function updateTripStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus, amountPaid } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) throw httpError(404, 'Trip not found');

    if (status) {
      const validStatuses = ['Pending', 'Confirmed', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) throw httpError(400, 'Invalid trip status');
      trip.status = status;
    }

    if (paymentStatus) {
      const validPayment = ['Pending', 'Paid', 'Partial', 'Refunded'];
      if (!validPayment.includes(paymentStatus)) throw httpError(400, 'Invalid payment status');
      trip.paymentStatus = paymentStatus;
    }

    if (amountPaid !== undefined) {
      trip.amountPaid = Number(amountPaid) || 0;
    }

    await trip.save();
    res.json({ ok: true, trip });
  } catch (error) {
    next(error);
  }
}

// 4. Customers Management
async function getCustomers(req, res, next) {
  try {
    const { search } = req.query;
    const filter = { role: { $ne: 'admin' } };

    if (search) {
      const safeSearch = escapeRegex(String(search).trim());
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [users, trips] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).lean(),
      Trip.find().lean(),
    ]);

    // Map trips and spend to customers
    const userStats = {};
    trips.forEach((t) => {
      const uid = t.userId?.toString();
      if (!uid) return;
      if (!userStats[uid]) {
        userStats[uid] = { tripsCount: 0, totalSpend: 0, latestTrip: null };
      }
      userStats[uid].tripsCount++;
      userStats[uid].totalSpend += getTripTotal(t);
      if (!userStats[uid].latestTrip || new Date(t.createdAt) > new Date(userStats[uid].latestTrip.createdAt)) {
        userStats[uid].latestTrip = { destination: t.destination, date: t.createdAt };
      }
    });

    const customers = users.map((u) => {
      const uid = u._id.toString();
      const stats = userStats[uid] || { tripsCount: 0, totalSpend: 0, latestTrip: null };
      return {
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role || 'user',
        joinedAt: u.createdAt,
        tripsCount: stats.tripsCount,
        totalSpend: Math.round(stats.totalSpend),
        latestTrip: stats.latestTrip,
      };
    });

    res.json({ total: customers.length, customers });
  } catch (error) {
    next(error);
  }
}

async function getCustomerDetails(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await User.findById(id).select('-passwordHash').lean();
    if (!customer) throw httpError(404, 'Customer not found');

    const customerTrips = await Trip.find({ userId: id }).sort({ createdAt: -1 }).lean();
    const totalSpend = customerTrips.reduce((sum, t) => sum + getTripTotal(t), 0);

    res.json({
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        joinedAt: customer.createdAt,
        preferences: customer.preferences || {},
      },
      stats: {
        tripsCount: customerTrips.length,
        totalSpend: Math.round(totalSpend),
      },
      trips: customerTrips,
    });
  } catch (error) {
    next(error);
  }
}

// 5. Destinations Management
async function getDestinationsAnalytics(req, res, next) {
  try {
    const trips = await Trip.find().lean();
    const pakDestinations = require('../data/pakistanDestinations.json');

    const tripCounts = {};
    const tripRevenue = {};
    trips.forEach((t) => {
      const dest = t.destination || 'Other';
      tripCounts[dest] = (tripCounts[dest] || 0) + 1;
      tripRevenue[dest] = (tripRevenue[dest] || 0) + getTripTotal(t);
    });

    const enriched = (pakDestinations.destinations || []).map((d) => ({
      name: d.name,
      region: d.region,
      category: d.category,
      idealDays: d.idealDays,
      bestSeason: d.bestSeason,
      budgetTier: d.budgetTier,
      totalTripsBooked: tripCounts[d.name] || 0,
      totalRevenueGenerated: Math.round(tripRevenue[d.name] || 0),
    }));

    res.json({ destinations: enriched });
  } catch (error) {
    next(error);
  }
}

// 6. Vehicles Fleet Management
async function getVehicles(req, res, next) {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    res.json({ vehicles });
  } catch (error) {
    next(error);
  }
}

async function createVehicle(req, res, next) {
  try {
    const { type, name, category, capacity, luggageCapacity, fuelType, pricePerDay, driverChargePerDay, acAvailable } = req.body;
    if (!type || !name || !pricePerDay) throw httpError(400, 'Vehicle type, name, and price per day are required');

    const vehicle = await Vehicle.create({
      type,
      name,
      category: category || 'Standard',
      capacity: Number(capacity) || 4,
      luggageCapacity: Number(luggageCapacity) || 2,
      fuelType: fuelType || 'Petrol',
      pricePerDay: Number(pricePerDay),
      driverChargePerDay: Number(driverChargePerDay) || 1500,
      acAvailable: acAvailable !== false,
      isAvailable: true,
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    if (!vehicle) throw httpError(404, 'Vehicle not found');
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) throw httpError(404, 'Vehicle not found');
    res.json({ ok: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// 7. Hotels Management
async function getHotels(req, res, next) {
  try {
    const { city, category } = req.query;
    const filter = {};
    if (city && city !== 'All') filter.city = { $regex: city, $options: 'i' };
    if (category && category !== 'All') filter.category = category;

    const hotels = await HotelItem.find(filter).sort({ city: 1, name: 1 }).lean();
    res.json({ hotels });
  } catch (error) {
    next(error);
  }
}

async function createHotel(req, res, next) {
  try {
    const { name, city, category, starRating, pricePerNight, roomTypes, amenities } = req.body;
    if (!name || !city || !pricePerNight) throw httpError(400, 'Hotel name, city, and price per night are required');

    const hotel = await HotelItem.create({
      name,
      city,
      category: category || 'Mid-range',
      starRating: Number(starRating) || 3,
      pricePerNight: Number(pricePerNight),
      roomTypes: Array.isArray(roomTypes) ? roomTypes : ['Standard Room', 'Deluxe Room'],
      amenities: Array.isArray(amenities) ? amenities : ['Free WiFi', 'Breakfast', 'Hot Water'],
      isAvailable: true,
    });

    res.status(201).json({ hotel });
  } catch (error) {
    next(error);
  }
}

async function updateHotel(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = await HotelItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!hotel) throw httpError(404, 'Hotel not found');
    res.json({ hotel });
  } catch (error) {
    next(error);
  }
}

async function deleteHotel(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = await HotelItem.findByIdAndDelete(id);
    if (!hotel) throw httpError(404, 'Hotel not found');
    res.json({ ok: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// 8. Food & Menu Management
async function getMenuItems(req, res, next) {
  try {
    const { city, mealType } = req.query;
    const filter = {};
    if (city && city !== 'All') filter.city = { $regex: city, $options: 'i' };
    if (mealType && mealType !== 'All') filter.mealType = mealType;

    const menuItems = await MenuItem.find(filter).sort({ city: 1, mealType: 1 }).lean();
    res.json({ menuItems });
  } catch (error) {
    next(error);
  }
}

async function createMenuItem(req, res, next) {
  try {
    const { name, city, mealType, price, cuisine, isSpecialty } = req.body;
    if (!name || !city || !mealType || !price) throw httpError(400, 'Name, city, meal type, and price are required');

    const item = await MenuItem.create({
      name,
      city,
      mealType,
      price: Number(price),
      cuisine: cuisine || 'Traditional Pakistani',
      isSpecialty: Boolean(isSpecialty),
      isAvailable: true,
    });

    res.status(201).json({ menuItem: item });
  } catch (error) {
    next(error);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) throw httpError(404, 'Menu item not found');
    res.json({ menuItem: item });
  } catch (error) {
    next(error);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) throw httpError(404, 'Menu item not found');
    res.json({ ok: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// 9. Activities Management
async function getActivities(req, res, next) {
  try {
    const { destination, category } = req.query;
    const filter = {};
    if (destination && destination !== 'All') filter.destination = { $regex: destination, $options: 'i' };
    if (category && category !== 'All') filter.category = category;

    const activities = await ActivityItem.find(filter).sort({ destination: 1, name: 1 }).lean();
    res.json({ activities });
  } catch (error) {
    next(error);
  }
}

async function createActivity(req, res, next) {
  try {
    const { name, destination, category, pricePerPerson, durationHours, difficulty } = req.body;
    if (!name || !destination || !pricePerPerson) throw httpError(400, 'Name, destination, and price per person are required');

    const activity = await ActivityItem.create({
      name,
      destination,
      category: category || 'Sightseeing',
      pricePerPerson: Number(pricePerPerson),
      durationHours: Number(durationHours) || 2,
      difficulty: difficulty || 'Easy',
      isAvailable: true,
    });

    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
}

async function updateActivity(req, res, next) {
  try {
    const { id } = req.params;
    const activity = await ActivityItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!activity) throw httpError(404, 'Activity not found');
    res.json({ activity });
  } catch (error) {
    next(error);
  }
}

async function deleteActivity(req, res, next) {
  try {
    const { id } = req.params;
    const activity = await ActivityItem.findByIdAndDelete(id);
    if (!activity) throw httpError(404, 'Activity not found');
    res.json({ ok: true, message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// 10. Bookings & Reservations
async function getBookings(req, res, next) {
  try {
    const { status, paymentStatus, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (paymentStatus && paymentStatus !== 'All') filter.paymentStatus = paymentStatus;

    const total = await Trip.countDocuments(filter);
    const trips = await Trip.find(filter)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const bookings = trips.map((t) => {
      const totalAmount = getTripTotal(t);
      const paid = t.amountPaid || (t.paymentStatus === 'Paid' ? totalAmount : 0);
      return {
        id: t._id,
        bookingRef: `STP-${t._id.toString().slice(-6).toUpperCase()}`,
        customerName: t.userId?.fullName || 'Guest Traveler',
        customerEmail: t.userId?.email || 'N/A',
        destination: t.destination,
        departureLocation: t.departureLocation || 'Islamabad',
        startDate: t.startDate,
        endDate: t.endDate,
        passengers: t.passengers || 1,
        totalAmount,
        amountPaid: paid,
        remainingBalance: Math.max(0, totalAmount - paid),
        status: t.status || 'Pending',
        paymentStatus: t.paymentStatus || 'Pending',
        createdAt: t.createdAt,
      };
    });

    res.json({ total, bookings });
  } catch (error) {
    next(error);
  }
}

// 11. Revenue & Expenses
async function getRevenueAndExpenses(req, res, next) {
  try {
    const [trips, expenses] = await Promise.all([
      Trip.find().lean(),
      CompanyExpense.find().sort({ date: -1 }).lean(),
    ]);

    let totalRevenue = 0;
    trips.forEach((t) => {
      totalRevenue += getTripTotal(t);
    });

    let totalExpenses = 0;
    const categoryTotals = {
      Transport: 0,
      Food: 0,
      Hotel: 0,
      Activity: 0,
      Operations: 0,
      Reserve: 0,
      Other: 0,
    };

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalExpenses += amt;
      const cat = e.category || 'Other';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amt;
      } else {
        categoryTotals.Other += amt;
      }
    });

    const netProfit = Math.max(0, totalRevenue - totalExpenses);
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    res.json({
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin,
      },
      categoryTotals,
      expenses,
    });
  } catch (error) {
    next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, category, amount, date, description, tripId } = req.body;
    if (!title || !category || !amount) throw httpError(400, 'Title, category, and amount are required');

    const expense = await CompanyExpense.create({
      title,
      category,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      description: description || '',
      tripId: tripId || null,
      recordedBy: req.user._id,
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
}

// 12. Reports & Analytics (Data and CSV Export)
async function getReports(req, res, next) {
  try {
    const { format } = req.query;
    const [trips, expenses, users] = await Promise.all([
      Trip.find().populate('userId', 'fullName email').lean(),
      CompanyExpense.find().lean(),
      User.find({ role: { $ne: 'admin' } }).lean(),
    ]);

    let totalRev = 0;
    trips.forEach((t) => {
      totalRev += getTripTotal(t);
    });

    let totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const profit = Math.max(0, totalRev - totalExp);

    if (format === 'csv') {
      let csv = 'Trip ID,Customer Name,Customer Email,Destination,Start Date,End Date,Passengers,Total Price (PKR),Status,Payment Status\n';
      trips.forEach((t) => {
        const id = t._id;
        const name = (t.userId?.fullName || 'Guest').replace(/,/g, ' ');
        const email = (t.userId?.email || 'N/A').replace(/,/g, ' ');
        const dest = (t.destination || '').replace(/,/g, ' ');
        const start = t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A';
        const end = t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A';
        const pass = t.passengers || 1;
        const cost = getTripTotal(t);
        const st = t.status || 'Pending';
        const pst = t.paymentStatus || 'Pending';
        csv += `${id},"${name}","${email}","${dest}",${start},${end},${pass},${cost},${st},${pst}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=smart_travel_planner_report.csv');
      return res.status(200).send(csv);
    }

    res.json({
      summary: {
        totalTrips: trips.length,
        totalCustomers: users.length,
        totalRevenue: Math.round(totalRev),
        totalExpenses: Math.round(totalExp),
        companyProfit: Math.round(profit),
        profitMargin: totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : '0.0',
      },
      topDestinations: Object.entries(
        trips.reduce((acc, t) => {
          acc[t.destination] = (acc[t.destination] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    next(error);
  }
}

// 13. Admin Profile
async function getAdminProfile(req, res, next) {
  try {
    const admin = await User.findById(req.user._id).select('-passwordHash').lean();
    res.json({
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminProfile(req, res, next) {
  try {
    const { fullName } = req.body;
    if (!fullName || fullName.trim().length < 2) {
      throw httpError(400, 'Full name must be at least 2 characters');
    }
    const admin = await User.findById(req.user._id);
    admin.fullName = fullName.trim();
    await admin.save();
    res.json({
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getBudgetAllocation,
  getTrips,
  updateTripStatus,
  getCustomers,
  getCustomerDetails,
  getDestinationsAnalytics,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getBookings,
  getRevenueAndExpenses,
  createExpense,
  getReports,
  getAdminProfile,
  updateAdminProfile,
};
