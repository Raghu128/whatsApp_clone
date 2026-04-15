/**
 * Correlation ID Utility
 * 
 * Generates and propagates correlation IDs across services for request tracing.
 * The API Gateway generates the ID, and it flows through all downstream services.
 * 
 * Usage:
 *   // As middleware (in Express app)
 *   app.use(correlationMiddleware);
 * 
 *   // In service-to-service calls, forward req.correlationId as x-correlation-id header
 */

const { v4: uuidv4 } = require('uuid');

const HEADER_NAME = 'x-correlation-id';

/**
 * Generate a new correlation ID (UUID v4).
 * @returns {string} New correlation ID
 */
function generateCorrelationId() {
  return uuidv4();
}

/**
 * Express middleware to extract or generate a correlation ID.
 * Sets req.correlationId and adds it to the response headers.
 */
function correlationMiddleware(req, res, next) {
  // Use existing correlation ID from upstream (API Gateway) or generate a new one
  const correlationId = req.headers[HEADER_NAME] || generateCorrelationId();

  req.correlationId = correlationId;

  // Set on response headers for client-side tracing
  res.setHeader(HEADER_NAME, correlationId);

  next();
}

module.exports = {
  generateCorrelationId,
  correlationMiddleware,
  HEADER_NAME,
};
