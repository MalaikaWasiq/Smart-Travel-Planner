const mongoose = require('mongoose');

const hotelItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    stars: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    roomTypes: [{ type: String, trim: true }],
    roomsAvailable: {
      type: Number,
      default: 10,
      min: 0,
    },
    capacityPerRoom: {
      type: Number,
      default: 2,
      min: 1,
    },
    amenities: [{ type: String, trim: true }],
    contact: {
      type: String,
      default: '+92 300 1234567',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HotelItem', hotelItemSchema);
