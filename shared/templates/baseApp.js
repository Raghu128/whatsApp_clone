/**
 * Base Express App Template
 * 
 * Reusable factory function that creates a pre-configured Express app
 * with all shared middleware. Each microservice calls this to get a
 * consistent base with logging, CORS, error handling, etc.
 * 
 * Usage:
 *   const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
 *   
 *   const { app } = createBaseApp({
 *     serviceName: 'auth-service',
 *     enableCors: true,
 *   });
 * 
 *   // Add service-specific routes
 *   app.use('/api/v1/auth', authRoutes);
 * 
 *   // Start server
 *   app.listen(3001);
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('../utils/logger');
const { correlationMiddleware } = require('../utils/correlationId');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * Create a pre-configured Express application.
 * 
 * @param {object} options
 * @param {string} options.serviceName - Name of the microservice
 * @param {boolean} [options.enableCors=true] - Enable CORS
 * @param {boolean} [options.enableCompression=true] - Enable response compression
 * @returns {{ app: Express.Application, log: winston.Logger }}
 */
function createBaseApp(options = {}) {
  const {
    serviceName = 'unknown-service',
    enableCors = true,
    enableCompression = true,
  } = options;

  const app = express();
  const log = logger.child({ service: serviceName });

  // ── Attach service name to all requests ──
  app.use((req, _res, next) => {
    req.serviceName = serviceName;
    next();
  });

  // ── Security Headers ──
  app.use(helmet());

  // ── CORS ──
  if (enableCors) {
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-user-id'],
      credentials: true,
    }));
  }

  // ── Body Parsing ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Response Compression ──
  if (enableCompression) {
    app.use(compression());
  }

  // ── Correlation ID ──
  app.use(correlationMiddleware);

  // ── HTTP Request Logging ──
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message) => log.http(message.trim()),
    },
  }));

  // ── Health Check (every service gets one) ──
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: serviceName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ── Readiness Check ──
  app.get('/ready', (_req, res) => {
    res.status(200).json({
      status: 'ready',
      service: serviceName,
    });
  });

  /**
   * Mount error handler AFTER all routes.
   * This must be called by the service after adding its routes:
   * 
   *   app.use('/api/v1/auth', authRoutes);
   *   mountErrorHandler(app);
   */
  function mountErrorHandler() {
    // 404 handler for undefined routes
    app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
    });

    // Global error handler
    app.use(errorHandler);
  }

  return { app, log, mountErrorHandler };
}

module.exports = { createBaseApp };
