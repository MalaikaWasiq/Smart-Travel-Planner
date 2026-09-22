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
  if (statusCode >= 500) {
    console.error(`[api] ${req.method} ${req.originalUrl} failed: ${error.message}`);
    message = 'The server could not complete this request';
  }

  res.status(statusCode).json({
    message,
  });
}

module.exports = { notFound, errorHandler };
