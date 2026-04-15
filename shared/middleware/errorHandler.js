/**
 * Global Error Handler Middleware
 * 
 * Catches all unhandled errors in Express routes and returns
 * standardized error responses. Also includes AppError class
 * for throwing operational errors with status codes.
 * 
 * Usage:
 *   const { errorHandler, AppError } = require('@whatsapp-clone/shared');
 * 
 *   // Throw operational errors
 *   throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 * 
 *   // Mount as last middleware
 *   app.use(errorHandler);
 */

const logger = require('../utils/logger');

/**
 * Custom application error with HTTP status code and error code.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
   * @param {*} [details=null] - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware.
 * Must be registered as the LAST middleware.
 */
function errorHandler(err, req, res, _next) {
  const log = logger.child({
    service: req.serviceName || 'unknown',
    correlationId: req.correlationId,
  });

  // Default error properties
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Joi validation error
  if (err.isJoi) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log the error
  if (statusCode >= 500) {
    log.error('Unhandled error', {
      statusCode,
      code,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    log.warn('Client error', {
      statusCode,
      code,
      message,
      path: req.path,
      method: req.method,
    });
  }

  // Don't leak internal error details in production
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred';
    details = null;
  }

  const response = {
    success: false,
    error: { code, message },
  };

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
}

module.exports = { errorHandler, AppError };
