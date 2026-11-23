const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');

const User = require('../models/User');
const Trip = require('../models/Trip');
const ChatSession = require('../models/ChatSession');
const Interaction = require('../models/Interaction');
const Alert = require('../models/Alert');
const httpError = require('../utils/httpError');

function toSafeUser(user) {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : (user.id ? String(user.id) : ''),
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    country: user.country || 'Pakistan',
    avatarUrl: user.avatarUrl || '',
    role: user.role || 'user',
    preferences: user.preferences || {},
    createdAt: user.createdAt,
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '7d' }
  );
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('@.') || trimmed.endsWith('.')) return false;
  return true;
}

async function signup(req, res, next) {
  try {
    const isDbConnected = mongoose.connection.readyState === 1 || Boolean(req.app.locals.dbReady);
    if (!isDbConnected) {
      const ok = await connectDb(req.app);
      if (!ok && mongoose.connection.readyState !== 1) {
        throw httpError(503, 'Database is currently offline. Please ensure MongoDB is running.');
      }
    }

    const { fullName, email, password, role, adminCode, adminInviteCode } = req.body;

    if (!fullName || !email || !password) {
      throw httpError(400, 'Full name, email, and password are required');
    }

    const cleanFullName = String(fullName).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (!isValidEmail(normalizedEmail)) {
      throw httpError(400, 'Please enter a valid email address (e.g. name@gmail.com)');
    }

    if (cleanPassword.length < 6) {
      throw httpError(400, 'Password must be at least 6 characters');
    }

    let finalRole = 'user';
    if (role === 'admin') {
      const code = String(adminCode || adminInviteCode || '').trim();
      const expectedKey = String(process.env.ADMIN_KEY || 'AdminSecureKey2026!').trim();
      if (!code) {
        throw httpError(400, 'Admin Authorization Key is required');
      }
      if (code !== expectedKey) {
        throw httpError(403, 'Invalid Admin Authorization Key. Please contact system administrator.');
      }
      finalRole = 'admin';
    }

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      throw httpError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    const user = await User.create({
      fullName: cleanFullName,
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
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
    const isDbConnected = mongoose.connection.readyState === 1 || Boolean(req.app.locals.dbReady);
    if (!isDbConnected) {
      const ok = await connectDb(req.app);
      if (!ok && mongoose.connection.readyState !== 1) {
        throw httpError(503, 'Database is currently offline. Please ensure MongoDB is running.');
      }
    }

    const rawEmail = req.body.email;
    const rawPassword = req.body.password;
    const requestedRole = req.body.role;

    if (!rawEmail || !rawPassword) {
      throw httpError(400, 'Email and password are required');
    }

    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    const cleanPassword = String(rawPassword);

    if (!isValidEmail(normalizedEmail)) {
      throw httpError(400, 'Please enter a valid email address (e.g. name@gmail.com)');
    }

    if (cleanPassword.length < 6) {
      throw httpError(400, 'Password must be at least 6 characters');
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw httpError(401, 'Incorrect email or password');
    }

    const isValid = await bcrypt.compare(cleanPassword, user.passwordHash);

    if (!isValid) {
      throw httpError(401, 'Incorrect email or password');
    }

    if (requestedRole) {
      const cleanRequestedRole = String(requestedRole).toLowerCase().trim();
      if (cleanRequestedRole && user.role !== cleanRequestedRole) {
        throw httpError(403, `Selected portal (${cleanRequestedRole}) does not match your account role (${user.role}).`);
      }
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
    if (req.body.fullName !== undefined) {
      const fullName = String(req.body.fullName || '').trim();
      if (fullName.length < 2 || fullName.length > 80) throw httpError(400, 'Full name must be between 2 and 80 characters');
      req.user.fullName = fullName;
    }
    if (req.body.email !== undefined) {
      const cleanEmail = String(req.body.email || '').trim().toLowerCase();
      if (isValidEmail(cleanEmail) && cleanEmail !== req.user.email) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
        if (!existing) {
          req.user.email = cleanEmail;
        }
      }
    }
    if (req.body.phone !== undefined) {
      req.user.phone = String(req.body.phone || '').trim();
    }
    if (req.body.country !== undefined) {
      req.user.country = String(req.body.country || 'Pakistan').trim();
    }
    if (req.body.avatarUrl !== undefined) {
      req.user.avatarUrl = String(req.body.avatarUrl || '').trim();
    }
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

async function socialLogin(req, res, next) {
  try {
    const isDbConnected = mongoose.connection.readyState === 1 || Boolean(req.app.locals.dbReady);
    if (!isDbConnected) {
      const ok = await connectDb(req.app);
      if (!ok && mongoose.connection.readyState !== 1) {
        throw httpError(503, 'Database is currently offline. Please ensure MongoDB is running.');
      }
    }

    const { provider, role } = req.body;
    const normalizedProvider = String(provider || 'google').toLowerCase();

    const providerProfiles = {
      google: {
        fullName: 'Google Traveler',
        email: 'traveler.google@gmail.com',
      },
      apple: {
        fullName: 'Apple Traveler',
        email: 'traveler.apple@gmail.com',
      },
      facebook: {
        fullName: 'Facebook Traveler',
        email: 'traveler.facebook@gmail.com',
      },
    };

    const profile = providerProfiles[normalizedProvider] || providerProfiles.google;
    const finalRole = role === 'admin' ? 'admin' : 'user';

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      const passwordHash = await bcrypt.hash(`SocialAuthPass_${normalizedProvider}_2026`, 10);
      user = await User.create({
        fullName: profile.fullName,
        email: profile.email,
        passwordHash,
        role: finalRole,
        preferences: {
          defaultBudget: 75000,
          interests: ['Nature', 'Adventure'],
          preferredHotelType: 'Mid-range',
        },
      });
    }

    res.json({
      token: signToken(user),
      user: toSafeUser(user),
      provider: normalizedProvider,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { signup, login, socialLogin, me, updatePreferences, updateProfile, exportMyData, deleteMyData };
