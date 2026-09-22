const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { recommend } = require('../controllers/recommendationController');
const router = express.Router();
router.use(requireAuth);
router.post('/', recommend);
module.exports = router;
