const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Smart Travel Planner API',
    database: req.app.locals.dbReady ? 'connected' : 'not-connected',
    databaseError: req.app.locals.dbReady ? null : (req.app.locals.dbError || 'Unknown database error'),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/weather', weatherRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
