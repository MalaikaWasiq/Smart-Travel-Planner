const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const routeRoutes = require('./routes/routeRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const attractionRoutes = require('./routes/attractionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const alertRoutes = require('./routes/alertRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));

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
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Smart Travel Planner API',
    database: req.app.locals.dbReady ? 'connected' : 'not-connected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/alerts', alertRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
