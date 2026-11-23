const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    adminKey: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'Pakistan',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    preferences: {
      defaultBudget: Number,
      interests: [String],
      preferredHotelType: String,
      dataConsent: { type: Boolean, default: true },
      reducedMotion: { type: Boolean, default: false },
      largeText: { type: Boolean, default: false },
    },
    favorites: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
