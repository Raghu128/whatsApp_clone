/**
 * Notification Service — Environment Configuration
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  NOTIFICATION_SERVICE_PORT: Joi.number().default(3006),

  // MongoDB (Notification DB separate from Chat DB structurally mapping limits correctly gracefully)
  NOTIFICATION_DB_URI: Joi.string().default('mongodb://localhost:27017/notification_db'),

  // Redis configurations
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});

module.exports = config;
