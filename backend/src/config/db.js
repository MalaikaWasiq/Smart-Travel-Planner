const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI is not set. API will start, but database-backed routes will fail.');
    return {
      ready: false,
      error: 'MONGODB_URI is not set',
    };
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return {
      ready: true,
      error: null,
    };
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return {
      ready: false,
      error: error.message,
    };
  }
}

module.exports = connectDb;
