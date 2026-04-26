const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw httpError(401, 'Authentication token is required');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      throw httpError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(httpError(401, 'Invalid or expired token'));
      return;
    }
    next(error);
  }
}

module.exports = requireAuth;
