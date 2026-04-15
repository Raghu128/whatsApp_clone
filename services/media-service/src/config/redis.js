/**
 * Redis & BullMQ Queues Configuration
 * 
 * Supports both standard connection configurations managing Native publisher tracking implicitly
 * executing identical limits seamlessly!
 */

const Redis = require('ioredis');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('./env');

const log = logger.child({ service: 'media-service', component: 'redis' });

const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required explicitly by BullMQ
  enableReadyCheck: false,
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => log.info('Redis connected — BullMQ queue backing enabled'));
redisClient.on('error', (err) => log.error('Redis connection crashed securely handling queues natively', { error: err.message }));

async function disconnectRedis() {
  try {
    await redisClient.quit();
    log.info('Redis media configuration completely terminated cleanly');
  } catch (error) {
    log.error('Error closing Redis connection physically handling buffers', { error: error.message });
  }
}

module.exports = { redisClient, redisConfig, disconnectRedis };
