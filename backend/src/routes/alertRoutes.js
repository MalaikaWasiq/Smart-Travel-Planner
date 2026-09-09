const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { listAlerts, markRead, markAllRead } = require('../controllers/alertController');
const router = express.Router();
router.use(requireAuth);
router.get('/', listAlerts);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
module.exports = router;
