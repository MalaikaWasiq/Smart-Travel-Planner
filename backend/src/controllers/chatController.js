const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { answerTravelQuestion } = require('../services/chatService');
const { buildAppContext } = require('../services/appContextService');

/**
 * Direct conversational chat handler (works for both guests and authenticated users)
 * POST /api/chat
 */
async function handleChat(req, res, next) {
  try {
    const rawMessage = req.body.message ?? req.body.prompt;
    const message = String(rawMessage || '').trim();
    console.log(`[handleChat] INCOMING: "${message}", user: ${req.user ? req.user.email : 'guest'}, sessionId: ${req.body.sessionId}`);
    if (!message || message.length > 1000) {
      throw httpError(400, 'Message must be between 1 and 1000 characters');
    }

    const conversation = Array.isArray(req.body.conversation)
      ? req.body.conversation
      : Array.isArray(req.body.history)
      ? req.body.history
      : [];

    let appContext = {};
    let activeTrip = null;

    if (req.user) {
      try {
        const built = await buildAppContext({
          user: req.user,
          activeTripId: req.body.context?.tripId || req.body.tripId,
        });
        activeTrip = built.activeTrip;
        appContext = built.context || {};
      } catch (_) {
        appContext = { user: { name: req.user.name, email: req.user.email } };
      }
    }

    if (req.body.context) {
      appContext = { ...appContext, ...req.body.context };
    }

    const reply = await answerTravelQuestion({
      message,
      trip: activeTrip,
      appContext,
      history: conversation,
    });

    let savedSession = null;
    if (req.user) {
      let session = null;
      if (req.body.sessionId && mongoose.isValidObjectId(req.body.sessionId)) {
        session = await ChatSession.findOne({ _id: req.body.sessionId, userId: req.user._id });
      }
      if (!session) {
        // Auto-create chat session titled by user's query like ChatGPT
        const sessionTitle = message.length > 50 ? `${message.slice(0, 47)}...` : message;
        session = await ChatSession.create({
          userId: req.user._id,
          tripId: activeTrip?._id || undefined,
          title: sessionTitle || 'New Conversation',
          messages: [],
        });
      }
      session.messages.push({ role: 'user', content: message });
      session.messages.push({
        role: 'assistant',
        content: reply.content,
        model: reply.model,
        fallbackUsed: reply.fallbackUsed,
        recommendedDestinations: reply.recommendedDestinations || [],
        suggestedActions: reply.suggestedActions || [],
      });
      await session.save();
      savedSession = session;
    }

    res.json({
      reply: reply.content,
      message: {
        role: 'assistant',
        content: reply.content,
        recommendedDestinations: reply.recommendedDestinations || [],
        suggestedActions: reply.suggestedActions || [],
        model: reply.model,
        fallbackUsed: reply.fallbackUsed,
        createdAt: new Date().toISOString(),
      },
      recommendedDestinations: reply.recommendedDestinations || [],
      suggestedActions: reply.suggestedActions || [],
      session: savedSession,
    });
  } catch (error) {
    next(error);
  }
}

async function createSession(req, res, next) {
  try {
    let trip = null;
    if (req.body.tripId) {
      trip = await Trip.findOne({ _id: req.body.tripId, userId: req.user._id });
      if (!trip) throw httpError(404, 'Trip not found');
    }
    const session = await ChatSession.create({
      userId: req.user._id,
      tripId: trip?._id,
      title: String(req.body.title || (trip ? `${trip.destination} - SafarSaathi AI` : 'SafarSaathi AI Chat')).slice(0, 100),
    });
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

async function listSessions(req, res, next) {
  try {
    res.json({
      sessions: await ChatSession.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(30),
    });
  } catch (error) {
    next(error);
  }
}

async function getSession(req, res, next) {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');
    res.json({ session });
  } catch (error) {
    next(error);
  }
}

async function postMessage(req, res, next) {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');

    const message = String(req.body.message || '').trim();
    if (!message || message.length > 1000) {
      throw httpError(400, 'Message must be between 1 and 1000 characters');
    }

    const { activeTrip, context } = await buildAppContext({
      user: req.user,
      activeTripId: session.tripId,
      currentSessionId: session._id,
    });

    const history = session.messages.map((item) => ({ role: item.role, content: item.content }));
    session.messages.push({ role: 'user', content: message });

    const reply = await answerTravelQuestion({
      message,
      trip: activeTrip,
      appContext: context,
      history,
    });

    session.messages.push({
      role: 'assistant',
      content: reply.content,
      model: reply.model,
      fallbackUsed: reply.fallbackUsed,
      recommendedDestinations: reply.recommendedDestinations || [],
      suggestedActions: reply.suggestedActions || [],
    });

    await session.save();
    const lastMsg = session.messages[session.messages.length - 1];
    res.json({
      reply: reply.content,
      content: reply.content,
      session,
      message: lastMsg,
      recommendedDestinations: reply.recommendedDestinations || [],
      suggestedActions: reply.suggestedActions || [],
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleChat,
  createSession,
  listSessions,
  getSession,
  postMessage,
  deleteSession,
};
