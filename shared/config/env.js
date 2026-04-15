/**
 * Environment Configuration Factory
 * 
 * Creates a validated environment configuration using Joi.
 * Each service calls this with its own schema to get validated config.
 * 
 * Usage:
 *   const { createEnvConfig } = require('@whatsapp-clone/shared');
 *   const Joi = require('joi');
 * 
 *   const config = createEnvConfig(Joi.object({
 *     PORT: Joi.number().default(3001),
 *     DB_HOST: Joi.string().required(),
 *     // ... service-specific vars
 *   }));
 */

const Joi = require('joi');
const path = require('path');

// Load .env from the monorepo root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Base schema with common environment variables shared across all services.
 */
const baseSchema = {
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  JWT_SECRET: Joi.string().required().description('Shared JWT secret for stateless validation'),

  ENCRYPTION_KEY: Joi.string().required().description('AES-256 encryption key'),
};

/**
 * Create a validated environment config by merging base schema with service-specific schema.
 * 
 * @param {object} serviceSchema - Joi schema object for service-specific env vars
 * @returns {object} Validated and frozen configuration object
 */
function createEnvConfig(serviceSchema = {}) {
  const fullSchema = Joi.object({
    ...baseSchema,
    ...serviceSchema,
  }).unknown(true); // Allow other env vars to exist

  const { error, value } = fullSchema.validate(process.env, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((d) => `  - ${d.message}`).join('\n');
    throw new Error(
      `Environment validation failed:\n${messages}\n\nPlease check your .env file.`
    );
  }

  return Object.freeze(value);
}

module.exports = { createEnvConfig, baseSchema };
