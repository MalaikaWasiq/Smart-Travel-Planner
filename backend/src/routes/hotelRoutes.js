const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { listHotels } = require('../controllers/hotelController');

const router = express.Router();
router.use(requireAuth);
router.get('/', listHotels);
module.exports = router;
