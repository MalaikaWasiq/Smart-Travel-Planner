const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    time: String,
    place: String,
    type: String,
    description: String,
    estimatedCost: Number,
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    day: Number,
    title: String,
    weatherNote: String,
    activities: [activitySchema],
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: Number,
      required: true,
      min: 1,
      max: 14,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    interests: [String],
    weather: Object,
    forecast: [Object],
    itinerary: [itineraryDaySchema],
    hotels: [Object],
    budgetBreakdown: {
      hotels: Number,
      food: Number,
      transport: Number,
      activities: Number,
      totalEstimated: Number,
      remaining: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
