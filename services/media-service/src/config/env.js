/**
 * Media Service — Environment Configuration
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  MEDIA_SERVICE_PORT: Joi.number().default(3005),

  // Storage Type configs deciding Native execution rules properly mapping
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
  
  // Local storage properties
  LOCAL_STORAGE_PATH: Joi.string().default('./uploads'),

  // AWS S3 configuration definitions (Tasks 7.3 mappings)
  AWS_REGION: Joi.string().allow('').optional(),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_S3_BUCKET: Joi.string().allow('').optional(),

  // Redis configurations identically managing BullMQ and EventBus
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});

module.exports = config;
