const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply auth + admin verification on all routes
router.use(requireAuth);
router.use(requireAdmin);

// 1. Dashboard Overview
router.get('/dashboard', adminController.getDashboardStats);

// 2. Smart Budget Allocation
router.get('/budget-allocation', adminController.getBudgetAllocation);

// 3. Trips Management
router.get('/trips', adminController.getTrips);
router.patch('/trips/:id/status', adminController.updateTripStatus);

// 4. Customers Management
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetails);

// 5. Destinations Management
router.get('/destinations', adminController.getDestinationsAnalytics);

// 6. Vehicles Fleet Management
router.get('/vehicles', adminController.getVehicles);
router.post('/vehicles', adminController.createVehicle);
router.put('/vehicles/:id', adminController.updateVehicle);
router.delete('/vehicles/:id', adminController.deleteVehicle);

// 7. Hotels Management
router.get('/hotels', adminController.getHotels);
router.post('/hotels', adminController.createHotel);
router.put('/hotels/:id', adminController.updateHotel);
router.delete('/hotels/:id', adminController.deleteHotel);

// 8. Food & Menu Management
router.get('/menu-items', adminController.getMenuItems);
router.post('/menu-items', adminController.createMenuItem);
router.put('/menu-items/:id', adminController.updateMenuItem);
router.delete('/menu-items/:id', adminController.deleteMenuItem);

// 9. Activities Management
router.get('/activities', adminController.getActivities);
router.post('/activities', adminController.createActivity);
router.put('/activities/:id', adminController.updateActivity);
router.delete('/activities/:id', adminController.deleteActivity);

// 10. Bookings & Reservations
router.get('/bookings', adminController.getBookings);

// 11. Revenue & Expenses
router.get('/revenue-expenses', adminController.getRevenueAndExpenses);
router.post('/expenses', adminController.createExpense);

// 12. Reports & Analytics
router.get('/reports', adminController.getReports);

// 13. Admin Profile
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);

module.exports = router;
