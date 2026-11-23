const express = require('express');
const { optionalAuth } = require('../middleware/authMiddleware');
const { listHotels, verifyAvailability } = require('../controllers/hotelController');

const router = express.Router();
router.use(optionalAuth);

router.get('/', listHotels);
router.post('/check-availability', verifyAvailability);

module.exports = router;
