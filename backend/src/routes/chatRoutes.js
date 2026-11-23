const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const {
  handleChat,
  createSession,
  listSessions,
  getSession,
  postMessage,
  deleteSession,
} = require('../controllers/chatController');

const router = express.Router();

/**
 * Universal Chat Endpoint:
 * POST /api/chat
 * If { message } is present -> processes conversation through SafarSaathi AI
 * If { tripId } is present without message and user is logged in -> creates a ChatSession
 */
// Universal Conversational Chat Endpoint (Guest + Authenticated Users)
router.post('/', optionalAuth, handleChat);

// Explicit session creation for authenticated users
router.post('/sessions', requireAuth, createSession);

// List all chat sessions for authenticated user
router.get('/', requireAuth, listSessions);
router.get('/sessions', requireAuth, listSessions);

// Get single session
router.get('/:id', requireAuth, getSession);

// Post message into existing session
router.post('/:id/messages', requireAuth, postMessage);

// Delete session
router.delete('/:id', requireAuth, deleteSession);

module.exports = router;
