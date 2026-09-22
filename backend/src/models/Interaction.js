const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
    eventType: {
      type: String,
      required: true,
      enum: ['view', 'open_details', 'add_to_trip', 'select', 'remove', 'rating'],
    },
    itemType: { type: String, trim: true },
    itemId: { type: String, trim: true },
    value: mongoose.Schema.Types.Mixed,
    context: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interaction', interactionSchema);
