const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Trip = require('../models/Trip');
const ChatSession = require('../models/ChatSession');
const Interaction = require('../models/Interaction');
const Alert = require('../models/Alert');
const httpError = require('../utils/httpError');

function toSafeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    preferences: user.preferences || {},
    createdAt: user.createdAt,
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '7d' }
  );
}

async function signup(req, res, next) {
  try {
    if (!req.app.locals.dbReady) {
      throw httpError(503, 'Database is not configured. Set LOCAL_MONGODB_URI and restart the backend.');
    }

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      throw httpError(400, 'Full name, email, and password are required');
    }

    if (password.length < 6) {
      throw httpError(400, 'Password must be at least 6 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      throw httpError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    res.status(201).json({
      token: signToken(user),
      user: toSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    if (!req.app.locals.dbReady) {
      throw httpError(503, 'Database is not configured. Set LOCAL_MONGODB_URI and restart the backend.');
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw httpError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      throw httpError(401, 'Incorrect email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw httpError(401, 'Incorrect email or password');
    }

    res.json({
      token: signToken(user),
      user: toSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: toSafeUser(req.user) });
}

async function updatePreferences(req, res, next) {
  try {
    if (!req.app.locals.dbReady) {
      throw httpError(503, 'Database is not configured. Start local MongoDB and restart the backend.');
    }

    const allowedInterests = new Set(['History', 'Food', 'Nature', 'Adventure', 'Shopping', 'Culture']);
    const allowedHotelTypes = new Set(['Any', 'Budget', 'Mid-range', 'Luxury', 'Boutique']);
    const defaultBudget = Number(req.body.defaultBudget);
    const interests = Array.isArray(req.body.interests)
      ? [...new Set(req.body.interests.map((value) => String(value).trim()))]
      : [];
    const preferredHotelType = String(req.body.preferredHotelType || 'Any').trim();

    if (!Number.isFinite(defaultBudget) || defaultBudget < 0 || defaultBudget > 10000000) {
      throw httpError(400, 'Default budget must be between 0 and 10,000,000 PKR');
    }
    if (interests.some((interest) => !allowedInterests.has(interest))) {
      throw httpError(400, 'One or more interests are not supported');
    }
    if (!allowedHotelTypes.has(preferredHotelType)) {
      throw httpError(400, 'Preferred hotel type is not supported');
    }

    req.user.preferences = {
      defaultBudget, interests, preferredHotelType,
      dataConsent: req.body.dataConsent === undefined ? req.user.preferences?.dataConsent !== false : Boolean(req.body.dataConsent),
      reducedMotion: req.body.reducedMotion === undefined ? Boolean(req.user.preferences?.reducedMotion) : Boolean(req.body.reducedMotion),
      largeText: req.body.largeText === undefined ? Boolean(req.user.preferences?.largeText) : Boolean(req.body.largeText),
    };
    await req.user.save();
    res.json({ user: toSafeUser(req.user) });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const fullName = String(req.body.fullName || '').trim();
    if (fullName.length < 2 || fullName.length > 80) throw httpError(400, 'Full name must be between 2 and 80 characters');
    req.user.fullName = fullName;
    await req.user.save();
    res.json({ user: toSafeUser(req.user) });
  } catch (error) { next(error); }
}

async function exportMyData(req, res, next) {
  try {
    const [trips, chats, interactions, alerts] = await Promise.all([
      Trip.find({ userId: req.user._id }).lean(),
      ChatSession.find({ userId: req.user._id }).lean(),
      Interaction.find({ userId: req.user._id }).lean(),
      Alert.find({ userId: req.user._id }).lean(),
    ]);
    res.json({ exportedAt: new Date().toISOString(), user: toSafeUser(req.user), trips, chats, interactions, alerts });
  } catch (error) { next(error); }
}

async function deleteMyData(req, res, next) {
  try {
    const password = String(req.body.password || '');
    const userWithPassword = await User.findById(req.user._id);
    if (!userWithPassword || !password || !(await bcrypt.compare(password, userWithPassword.passwordHash))) throw httpError(401, 'Password confirmation is incorrect');
    await Promise.all([
      Trip.deleteMany({ userId: req.user._id }),
      ChatSession.deleteMany({ userId: req.user._id }),
      Interaction.deleteMany({ userId: req.user._id }),
      Alert.deleteMany({ userId: req.user._id }),
    ]);
    await User.deleteOne({ _id: req.user._id });
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { signup, login, me, updatePreferences, updateProfile, exportMyData, deleteMyData };
