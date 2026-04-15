/**
 * Auth Service — Redis Configuration
 * 
 * Used for:
 *   - Token blacklist (logout/revocation)
 *   - Event publishing via EventBus
 */

const Redis = require('ioredis');
const logger = require('@whatsapp-clone/shared/utils/logger');

const log = logger.child({ service: 'auth-service', component: 'redis' });

const config = require('./env');

const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Main Redis client for token blacklist operations
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  log.info('Redis connected');
});

redisClient.on('error', (err) => {
  log.error('Redis connection error', { error: err.message });
});

/**
 * Gracefully disconnect Redis.
 */
async function disconnectRedis() {
  try {
    await redisClient.quit();
    log.info('Redis connection closed');
  } catch (error) {
    log.error('Error closing Redis connection', { error: error.message });
  }
}

module.exports = { redisClient, redisConfig, disconnectRedis };
