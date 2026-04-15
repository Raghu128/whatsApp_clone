/**
 * API Gateway — Environment Configuration
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  // Gateway Port
  API_GATEWAY_PORT: Joi.number().default(3000),

  // JWT Secret (Matches Auth Service)
  JWT_SECRET: Joi.string().required(),

  // Redis (For Rate Limiting & Blacklist checks)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Service URLs (Service Registry Config)
  AUTH_SERVICE_URL: Joi.string().default('http://localhost:3001'),
  USER_SERVICE_URL: Joi.string().default('http://localhost:3002'),
  CHAT_SERVICE_URL: Joi.string().default('http://localhost:3003'),
  PRESENCE_SERVICE_URL: Joi.string().default('http://localhost:3004'),
  MEDIA_SERVICE_URL: Joi.string().default('http://localhost:3005'),
  NOTIFICATION_SERVICE_URL: Joi.string().default('http://localhost:3006'),
});

module.exports = config;
