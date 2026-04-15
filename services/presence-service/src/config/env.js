/**
 * Presence Service — Environment Configuration
 * 
 * Redis-only architecture! No PostgreSQL or MongoDB overhead needed here.
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  PRESENCE_SERVICE_PORT: Joi.number().default(3004),

  JWT_SECRET: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});

module.exports = config;
