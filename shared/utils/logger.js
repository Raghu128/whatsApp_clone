/**
 * Shared Winston Logger
 * 
 * Structured JSON logging with correlation ID support.
 * Each service creates a child logger with its service name.
 * 
 * Usage:
 *   const { logger } = require('@whatsapp-clone/shared');
 *   const log = logger.child({ service: 'auth-service' });
 *   log.info('User registered', { userId: '123' });
 */

const winston = require('winston');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-readable format for development
const devFormat = printf(({ level, message, timestamp, service, correlationId, ...meta }) => {
  const svc = service ? `[${service}]` : '';
  const corrId = correlationId ? `[${correlationId}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level} ${svc}${corrId} ${message}${metaStr}`;
});

// Structured JSON format for production
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

// Development format with colors
const developmentFormat = combine(
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  colorize(),
  devFormat
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {},
  format: process.env.NODE_ENV === 'production' ? prodFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

// In production, also write to files
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
  }));
}

module.exports = logger;
