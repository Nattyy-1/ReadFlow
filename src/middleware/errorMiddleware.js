const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`Error: ${err.message}`.red);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.code === 'P2002') {
    error.message = `The ${err.meta.target} is already taken.`;
    error.statusCode = 409;
  }

  if (err.code === 'P2025') {
    error.message = err.message || 'Resource not found in database.';
    error.statusCode = 404;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Your session has expired. Please log in again.';
    error.statusCode = 401;
  }

  if (err.message && err.message.startsWith('ACTIVE_SESSION_EXISTS')) {
    const bookTitle = err.message.split(':')[1]; // Grabs "The Great Gatsby"
    error.message = `You already have an active session for "${bookTitle}".`;
    error.statusCode = 400; // Bad Request / Conflict
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
