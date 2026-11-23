const express = require('express');

const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const {
  generateTrip, updateTrip, updateItinerary, listTrips, getTrip, selectHotel, deleteTrip,
  addExpense, updateExpense, deleteExpense,
  previewItineraryChange, refreshRoute,
} = require('../controllers/tripController');

const router = express.Router();

router.post('/generate', optionalAuth, generateTrip);
router.get('/:id', optionalAuth, getTrip);

router.use(requireAuth);

router.get('/', listTrips);
router.patch('/:id', updateTrip);
router.patch('/:id/itinerary', updateItinerary);
router.patch('/:id/route', refreshRoute);
router.post('/:id/change-preview', previewItineraryChange);
router.patch('/:id/hotel', selectHotel);
router.post('/:id/expenses', addExpense);
router.patch('/:id/expenses/:expenseId', updateExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);
router.delete('/:id', deleteTrip);

module.exports = router;
