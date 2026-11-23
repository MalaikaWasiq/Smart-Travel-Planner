const fs = require('fs');
const path = require('path');

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';
  if (error.name === 'ValidationError') { statusCode = 400; message = 'One or more values are invalid'; }
  if (error.code === 11000) { statusCode = 409; message = 'A record with these details already exists'; }

  // Log to error.log file for rapid debugging
  try {
    const logPath = path.resolve(__dirname, '../../error.log');
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} [${statusCode}] ${error.stack || error.message}\n`;
    fs.appendFileSync(logPath, logLine);
  } catch (_) {}

  if (statusCode >= 500) {
    console.error(`[api] ${req.method} ${req.originalUrl} failed: ${error.stack || error.message}`);
    if (statusCode === 503 && error.message) {
      message = error.message;
    } else {
      // In dev mode, return the real error message so developer/user knows immediately what happened
      message = error.message || 'The server could not complete this request';
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    message,
    error: isProd && statusCode >= 500 ? 'An unexpected server error occurred' : error.message,
    ...(isProd ? {} : { stack: error.stack }),
  });
}

module.exports = { notFound, errorHandler };
