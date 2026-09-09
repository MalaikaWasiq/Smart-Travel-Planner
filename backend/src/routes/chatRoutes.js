const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { createSession, listSessions, getSession, postMessage, deleteSession } = require('../controllers/chatController');

const router = express.Router();
router.use(requireAuth);
router.post('/', createSession);
router.get('/', listSessions);
router.get('/:id', getSession);
router.post('/:id/messages', postMessage);
router.delete('/:id', deleteSession);
module.exports = router;
