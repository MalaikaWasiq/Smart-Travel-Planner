const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { createRoute } = require('../controllers/routeController');

const router = express.Router();
router.use(requireAuth);
router.post('/', createRoute);
module.exports = router;
