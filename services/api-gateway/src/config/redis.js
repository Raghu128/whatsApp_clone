/**
 * API Gateway — Redis Configuration
 * 
 * Used for:
 *   - Token blacklist checks
 *   - Global Rate Limiting
 */

const Redis = require('ioredis');
const logger = require('@whatsapp-clone/shared/utils/logger');

const log = logger.child({ service: 'api-gateway', component: 'redis' });
const config = require('./env');

const redisClient = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  log.info('Redis connected for API Gateway');
});

redisClient.on('error', (err) => {
  log.error('Redis connection error', { error: err.message });
});

async function disconnectRedis() {
  try {
    await redisClient.quit();
    log.info('Redis connection closed');
  } catch (error) {
    log.error('Error closing Redis connection', { error: error.message });
  }
}

module.exports = { redisClient, disconnectRedis };
