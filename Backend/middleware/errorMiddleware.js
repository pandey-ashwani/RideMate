import User from '../models/User.js';

// Not Found (404) Handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
export const errorHandler = async (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose / MongoDB E11000 Duplicate Key Error
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    statusCode = 400;
    if (err.keyPattern && err.keyPattern.email) {
      message = 'An account with this email address already exists';
    } else if (err.message && err.message.includes('username_1')) {
      // Attempt to drop stale username_1 index on the fly
      try {
        await User.collection.dropIndex('username_1');
        console.log('Dropped stale username_1 index on error catch');
      } catch (idxErr) {
        // Ignore if already dropped
      }
      message = 'Database index updated. Please submit your registration again.';
    } else {
      message = 'An account with these details already exists';
    }
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
