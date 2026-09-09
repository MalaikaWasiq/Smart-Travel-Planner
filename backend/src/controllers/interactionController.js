const Interaction = require('../models/Interaction');
const httpError = require('../utils/httpError');

async function logInteraction(req, res, next) {
  try {
    if (!req.app.locals.dbReady) throw httpError(503, 'Database is not configured');
    if (req.user.preferences?.dataConsent === false) return res.status(202).json({ recorded: false, reason: 'data-consent-disabled' });
    const { eventType, tripId, itemType, itemId, value, context } = req.body;
    if (!eventType) throw httpError(400, 'eventType is required');
    const interaction = await Interaction.create({
      userId: req.user._id,
      eventType,
      tripId: tripId || undefined,
      itemType,
      itemId,
      value,
      context,
    });
    res.status(201).json({ interaction });
  } catch (error) {
    next(error);
  }
}

module.exports = { logInteraction };
