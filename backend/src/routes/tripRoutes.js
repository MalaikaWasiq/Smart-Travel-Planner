const express = require('express');

const requireAuth = require('../middleware/authMiddleware');
const { generateTrip, listTrips, getTrip, deleteTrip } = require('../controllers/tripController');

const router = express.Router();

router.use(requireAuth);

router.post('/generate', generateTrip);
router.get('/', listTrips);
router.get('/:id', getTrip);
router.delete('/:id', deleteTrip);

module.exports = router;
