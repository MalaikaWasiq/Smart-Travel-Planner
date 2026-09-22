const express = require('express');

const requireAuth = require('../middleware/authMiddleware');
const {
  generateTrip, updateTrip, updateItinerary, listTrips, getTrip, selectHotel, deleteTrip,
  addExpense, updateExpense, deleteExpense,
  previewItineraryChange, refreshRoute,
} = require('../controllers/tripController');

const router = express.Router();

router.use(requireAuth);

router.post('/generate', generateTrip);
router.get('/', listTrips);
router.get('/:id', getTrip);
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
