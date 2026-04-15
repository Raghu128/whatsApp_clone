/**
 * @whatsapp-clone/shared
 * Central export for all shared utilities, middleware, events, and proto paths.
 */

// Utilities
const logger = require('./utils/logger');
const { encrypt, decrypt } = require('./utils/encryption');
const { success, error: errorResponse, paginated } = require('./utils/responseFormatter');
const { generateCorrelationId, correlationMiddleware } = require('./utils/correlationId');

// Events
const EventBus = require('./events/eventBus');
const EVENT_NAMES = require('./events/eventNames');
const eventSchemas = require('./events/eventSchemas');

// Middleware
const { errorHandler, AppError } = require('./middleware/errorHandler');
const { validate } = require('./middleware/validator');

// Config
const { createEnvConfig } = require('./config/env');

module.exports = {
  // Utilities
  logger,
  encrypt,
  decrypt,
  success,
  errorResponse,
  paginated,
  generateCorrelationId,
  correlationMiddleware,

  // Events
  EventBus,
  EVENT_NAMES,
  eventSchemas,

  // Middleware
  errorHandler,
  AppError,
  validate,

  // Config
  createEnvConfig,
};
