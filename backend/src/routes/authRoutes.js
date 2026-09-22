const express = require('express');

const { signup, login, me, updatePreferences, updateProfile, exportMyData, deleteMyData } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/me/preferences', requireAuth, updatePreferences);
router.patch('/me', requireAuth, updateProfile);
router.get('/me/export', requireAuth, exportMyData);
router.delete('/me', requireAuth, deleteMyData);

module.exports = router;
