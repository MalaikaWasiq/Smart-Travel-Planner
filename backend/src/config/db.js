const mongoose = require('mongoose');

let isConnecting = false;

async function connectDb(app) {
  const uri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-travel-planner';

  if (!uri) {
    console.warn('LOCAL_MONGODB_URI is not set. Database-backed routes will fail.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    if (app && app.locals) app.locals.dbReady = true;
    return true;
  }

  if (isConnecting) return false;
  isConnecting = true;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected');
    if (app && app.locals) app.locals.dbReady = true;
    isConnecting = false;
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (app && app.locals) app.locals.dbReady = false;
    isConnecting = false;
    return false;
  }
}

function initDbAutoReconnect(app) {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    if (app && app.locals) app.locals.dbReady = true;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    if (app && app.locals) app.locals.dbReady = false;
  });

  // Background auto-reconnection loop every 4 seconds if disconnected
  setInterval(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDb(app);
    }
  }, 4000);
}

module.exports = { connectDb, initDbAutoReconnect };
