const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    time: String,
    timeBlock: String,
    mealPolicy: String,
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
      required: false,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    startLocation: {
      type: String,
      default: 'Islamabad',
      trim: true,
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    endDate: {
      type: String,
    },
    category: {
      type: String,
      trim: true,
      default: '',
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
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Partial', 'Refunded'],
      default: 'Paid',
      index: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    refunds: {
      type: Number,
      default: 0,
      min: 0,
    },
    travelerGender: { type: String, enum: ['male', 'female', 'mixed'], default: 'mixed' },
    maleCount: { type: Number, default: 0 },
    femaleCount: { type: Number, default: 0 },
    interests: [String],
    travelType: {
      type: String,
      enum: ['Solo', 'Family', 'Group', 'Tour Company'],
      default: 'Solo',
    },
    transportation: {
      type: String,
      default: 'Private Car',
    },
    comfortLevel: {
      type: String,
      enum: ['Basic', 'Normal', 'Luxury'],
      default: 'Normal',
    },
    transportRequired: {
      type: Boolean,
      default: true,
    },
    foodRequired: {
      type: Boolean,
      default: true,
    },
    activitiesRequired: {
      type: Boolean,
      default: true,
    },
    roomsQuantity: {
      type: Number,
      default: 1,
    },
    selectedMeals: Object,
    hotelRequired: {
      type: Boolean,
      default: true,
    },
    tripMode: {
      type: String,
      enum: ['customized', 'company'],
      default: 'customized',
    },
    transportChoice: {
      type: String,
      enum: ['rental', 'own'],
      default: 'rental',
    },
    preferredRoute: {
      type: String,
      default: '',
    },
    foodChoice: {
      type: String,
      enum: ['included', 'self'],
      default: 'included',
    },
    optionalActivities: [Object],
    optionalExperiences: [Object],
    budgetDeductions: Object,
    numberOfPersons: {
      type: Number,
      default: 1,
    },
    budgetPerPerson: Number,
    vehicleDetails: Object,
    foodPlan: Object,
    packageDetails: Object,
    budgetAllocation: Object,
    safetyAdvisory: Object,
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
    hotel: Object,
    budgetSummary: Object,
    route: Object,
    budgetBreakdown: {
      hotels: Number,
      food: Number,
      transport: Number,
      activities: Number,
      companyProfit: Number,
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
