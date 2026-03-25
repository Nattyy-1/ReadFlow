const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  console.error(`Error: ${message}`.red);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.code === 'P2002') {
    let field = 'record';
    if (err.meta?.target) {
      field = Array.isArray(err.meta.target) ? err.meta.target[0] : err.meta.target;
    } else if (err.message.includes('fields: (`')) {
      field = err.message.split('(`')[1].split('`)')[0];
    }
    message = `The ${field.replace('_key', '').replace('_unique', '')} is already taken.`;
    statusCode = 409;
  }

  if (err.code === 'P2025' || (err.message && err.message.includes('P2025'))) {
    statusCode = 404;
    message = (err.message.includes('invocation') || err.message === 'P2025')
      ? 'The requested book or record was not found on your shelf.'
      : err.message;
  }


  if (err.name === 'ZodError') {
    statusCode = 400;

    const formatted = {};

    err.issues.forEach(e => {
      const key = e.path.slice(1).join('.');
      if (!formatted[key]) {
        formatted[key] = e.message;
      }
    });

    message = formatted;
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
    statusCode = 401;
  }

  if (err.message && err.message.startsWith('ACTIVE_SESSION_EXISTS')) {
    const bookTitle = err.message.split(':')[1] || 'this book';
    message = `You already have an active session for "${bookTitle}".`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
