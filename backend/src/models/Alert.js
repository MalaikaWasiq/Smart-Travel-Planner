const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  dedupeKey: { type: String, required: true },
  type: { type: String, enum: ['weather', 'budget', 'reminder', 'route'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  read: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

alertSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
module.exports = mongoose.model('Alert', alertSchema);
