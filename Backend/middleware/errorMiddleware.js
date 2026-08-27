// Not Found (404) Handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // ============================================================
  // MONGODB / MONGOOSE DUPLICATE KEY ERROR
  // ============================================================

  if (
    err.code === 11000 ||
    (err.message && err.message.includes('E11000'))
  ) {
    statusCode = 400;

    const keyPattern = err.keyPattern || {};
    const keyValue = err.keyValue || {};

    // Duplicate EMAIL
    if (
      keyPattern.email ||
      keyValue.email ||
      (err.message && err.message.includes('email'))
    ) {
      message =
        'Email already exists. Please use a different email or log in.';
    }

    // Duplicate PHONE
    else if (
      keyPattern.phone ||
      keyValue.phone ||
      (err.message && err.message.includes('phone'))
    ) {
      message =
        'Mobile number already exists. Please use a different number.';
    }

    // OLD USERNAME INDEX
    else if (
      keyPattern.username ||
      keyValue.username ||
      (err.message && err.message.includes('username_1'))
    ) {
      message =
        'Registration could not be completed because of a database configuration issue.';
    }

    // Other duplicate field
    else {
      message =
        'An account with these details already exists.';
    }
  }

  // ============================================================
  // MONGOOSE VALIDATION ERROR
  // ============================================================

  else if (err.name === 'ValidationError') {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(', ');
  }

  // ============================================================
  // MONGOOSE CAST ERROR
  // ============================================================

  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data provided.';
  }

  // ============================================================
  // RESPONSE
  // ============================================================

  return res.status(statusCode).json({
    success: false,
    message,
    stack:
      process.env.NODE_ENV === 'production'
        ? null
        : err.stack
  });
};