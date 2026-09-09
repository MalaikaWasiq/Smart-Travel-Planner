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

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['hotels', 'food', 'transport', 'activities', 'misc'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 240 },
    day: { type: Number, min: 1, max: 14 },
  },
  { timestamps: true }
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
    attractions: [Object],
    recommendationMetadata: {
      modelVersion: String,
      fallbackUsed: Boolean,
      rankedAt: Date,
    },
    itinerary: [itineraryDaySchema],
    itinerarySource: { type: String, enum: ['groq', 'fallback', 'user-edited'], default: 'fallback' },
    hotels: [Object],
    hotelSuggestions: [Object],
    selectedHotel: Object,
    route: Object,
    budgetBreakdown: {
      hotels: Number,
      food: Number,
      transport: Number,
      activities: Number,
      misc: Number,
      totalEstimated: Number,
      remaining: Number,
      percentUsed: Number,
      exceeded: Boolean,
      overBy: Number,
      currency: String,
      note: String,
      actualSpent: Number,
      actualRemaining: Number,
      actualPercentUsed: Number,
      actualExceeded: Boolean,
      actualOverBy: Number,
    },
    expenses: [expenseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
