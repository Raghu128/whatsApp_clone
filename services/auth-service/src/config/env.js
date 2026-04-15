/**
 * Auth Service — Environment Configuration
 * 
 * Validates and exports all required environment variables
 * using the shared Joi-based config factory.
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  // Service
  AUTH_SERVICE_PORT: Joi.number().default(3001),
  AUTH_GRPC_PORT: Joi.number().default(50051),

  // PostgreSQL (Auth DB)
  AUTH_DB_HOST: Joi.string().default('localhost'),
  AUTH_DB_PORT: Joi.number().default(5432),
  AUTH_DB_NAME: Joi.string().default('auth_db'),
  AUTH_DB_USER: Joi.string().default('postgres'),
  AUTH_DB_PASSWORD: Joi.string().default('postgres_password'),

  // JWT
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),
});

module.exports = config;
