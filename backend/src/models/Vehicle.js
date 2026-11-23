const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      unique: true,
      required: true,
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
      trim: true,
    },
    tier: {
      type: String,
      default: 'Medium',
    },
    capacity: {
      type: String,
      default: '4 Persons',
    },
    luggage: {
      type: String,
      default: '3 Luggage Bags',
    },
    maxPersons: {
      type: Number,
      required: true,
      min: 1,
    },
    rentPerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelPerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    driverCharges: {
      type: Number,
      default: 1500,
      min: 0,
    },
    billingUnit: {
      type: String,
      enum: ['per_day', 'per_trip'],
      default: 'per_day',
    },
    icon: {
      type: String,
      default: 'car-outline',
    },
    desc: {
      type: String,
      default: '',
    },
    isBike: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
