const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.LOCAL_MONGODB_URI;

  if (!uri) {
    console.warn('LOCAL_MONGODB_URI is not set. Database-backed routes will fail.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

module.exports = connectDb;
