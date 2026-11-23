const mongoose = require('mongoose');

const companyExpenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: false,
      index: true,
    },
    tripDestination: {
      type: String,
      default: 'General Operations',
    },
    category: {
      type: String,
      enum: ['transport', 'food', 'hotels', 'activities', 'fuel', 'driver', 'operational', 'misc'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: String,
      default: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyExpense', companyExpenseSchema);
