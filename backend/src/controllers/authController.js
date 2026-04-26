const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
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

function ensureDbReady(req) {
  if (req.app.locals.dbReady) return;
  const dbError = req.app.locals.dbError;
  const message = dbError
    ? `Database unavailable: ${dbError}`
    : 'Database is not configured. Set MONGODB_URI and restart the backend.';
  throw httpError(503, message);
}

async function signup(req, res, next) {
  try {
    ensureDbReady(req);

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
    ensureDbReady(req);

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

module.exports = { signup, login, me };
