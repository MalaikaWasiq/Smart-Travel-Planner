const ChatSession = require('../models/ChatSession');
const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { answerTravelQuestion } = require('../services/chatService');
const { buildAppContext } = require('../services/appContextService');

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
      title: String(req.body.title || (trip ? `${trip.destination} assistant` : 'Travel assistant')).slice(0, 100),
    });
    res.status(201).json({ session });
  } catch (error) { next(error); }
}

async function listSessions(req, res, next) {
  try { res.json({ sessions: await ChatSession.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(30) }); }
  catch (error) { next(error); }
}

async function getSession(req, res, next) {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');
    res.json({ session });
  } catch (error) { next(error); }
}

async function postMessage(req, res, next) {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');
    const message = String(req.body.message || '').trim();
    if (!message || message.length > 1000) throw httpError(400, 'Message must be between 1 and 1000 characters');
    const { activeTrip, context } = await buildAppContext({
      user: req.user,
      activeTripId: session.tripId,
      currentSessionId: session._id,
    });
    const history = session.messages.map((item) => ({ role: item.role, content: item.content }));
    session.messages.push({ role: 'user', content: message });
    const reply = await answerTravelQuestion({ message, trip: activeTrip, appContext: context, history });
    const suggestedActions = activeTrip
      ? ['Show my current budget', 'Summarize my trip history', 'What should I pack?', 'Show active alerts']
      : ['Summarize my trip history', 'Compare my trip budgets', 'Show active alerts', 'Suggest a destination'];
    session.messages.push({ role: 'assistant', ...reply, suggestedActions });
    await session.save();
    res.json({ session, message: session.messages.at(-1) });
  } catch (error) { next(error); }
}

async function deleteSession(req, res, next) {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) throw httpError(404, 'Chat session not found');
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { createSession, listSessions, getSession, postMessage, deleteSession };
