const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { listAttractions } = require('../controllers/attractionController');
const router = express.Router();
router.use(requireAuth);
router.get('/', listAttractions);
module.exports = router;
