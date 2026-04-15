/**
 * Presence Service — Redis Configuration Structure
 */

const Redis = require('ioredis');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('./env');

const log = logger.child({ service: 'presence-service', component: 'redis' });

const redisClient = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('connect', () => log.info('Redis connected — Primary Presence Database active'));
redisClient.on('error', (err) => log.error('Redis Presence Data connection error', { error: err.message }));

async function disconnectRedis() {
  try {
    await redisClient.quit();
    log.info('Redis connection cleanly terminated');
  } catch (error) {
    log.error('Error closing Redis connection', { error: error.message });
  }
}

module.exports = { redisClient, disconnectRedis };
