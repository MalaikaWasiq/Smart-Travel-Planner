const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { calculate } = require('../controllers/budgetController');

const router = express.Router();
router.use(requireAuth);
router.post('/calculate', calculate);
module.exports = router;
