const Alert = require('../models/Alert');
const Trip = require('../models/Trip');
const httpError = require('../utils/httpError');
const { syncTripAlerts } = require('../services/alertService');

async function listAlerts(req, res, next) {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(20);
    await Promise.all(trips.map(syncTripAlerts));
    const alerts = await Alert.find({ userId: req.user._id, active: true }).sort({ createdAt: -1 }).limit(100);
    res.json({ alerts, unreadCount: alerts.filter((item) => !item.read).length });
  } catch (error) { next(error); }
}

async function markRead(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } }, { new: true });
    if (!alert) throw httpError(404, 'Alert not found');
    res.json({ alert });
  } catch (error) { next(error); }
}

async function markAllRead(req, res, next) {
  try { await Alert.updateMany({ userId: req.user._id, active: true }, { $set: { read: true } }); res.json({ ok: true }); }
  catch (error) { next(error); }
}

module.exports = { listAlerts, markRead, markAllRead };
