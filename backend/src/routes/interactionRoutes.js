const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { logInteraction } = require('../controllers/interactionController');

const router = express.Router();
router.use(requireAuth);
router.post('/', logInteraction);
module.exports = router;
