const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    destinationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Cultural & Historical', 'Northern Areas', 'Adventure & Nature', 'Coastal Areas'],
      index: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    popularActivities: [String],
    bestTimeToVisit: String,
    travelDifficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging 4x4', 'Trekking'],
      default: 'Moderate',
    },
    weatherCity: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

destinationSchema.index({ name: 'text', description: 'text', region: 'text' });

module.exports = mongoose.model('Destination', destinationSchema);
