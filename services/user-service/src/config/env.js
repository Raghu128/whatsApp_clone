/**
 * User Service — Environment Configuration
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  // Service
  USER_SERVICE_PORT: Joi.number().default(3002),
  USER_GRPC_PORT: Joi.number().default(50052),

  // PostgreSQL (User DB)
  USER_DB_HOST: Joi.string().default('localhost'),
  USER_DB_PORT: Joi.number().default(5433),
  USER_DB_NAME: Joi.string().default('user_db'),
  USER_DB_USER: Joi.string().default('postgres'),
  USER_DB_PASSWORD: Joi.string().default('postgres_password'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});

module.exports = config;
