/**
 * Chat Service — Environment Configuration
 */

const Joi = require('joi');
const { createEnvConfig } = require('@whatsapp-clone/shared/config/env');

const config = createEnvConfig({
  // Service
  CHAT_SERVICE_PORT: Joi.number().default(3003),
  
  // Specific to Chat instances dynamically generating connection directories
  SERVER_ID: Joi.string().default(`chat-node-${Math.random().toString(36).substring(2, 9)}`),

  // MongoDB (Chat DB)
  CHAT_DB_URI: Joi.string().default('mongodb://localhost:27017/chat_db'),

  // JWT (for local statless socket auth validation matched across systems)
  JWT_SECRET: Joi.string().required(),

  // Encryption Key mapping AES integrations natively (Task 5.15)
  ENCRYPTION_KEY: Joi.string().length(64).required(),

  // Redis Server bounds
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // gRPC URLs
  USER_GRPC_URL: Joi.string().default('localhost:50052'),
});

module.exports = config;
