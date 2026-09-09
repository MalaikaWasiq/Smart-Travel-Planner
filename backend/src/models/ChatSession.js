const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 4000 },
  suggestedActions: [String],
  model: String,
  fallbackUsed: { type: Boolean, default: false },
}, { timestamps: true });

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
  title: { type: String, trim: true, maxlength: 100, default: 'Travel assistant' },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
