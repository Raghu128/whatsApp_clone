/**
 * Redis & MongoDB Standard Loaders
 */

const mongoose = require('mongoose');
const Redis = require('ioredis');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('./env');

const log = logger.child({ service: 'notification-service', component: 'database' });

// Setup Redis for Queues explicitly seamlessly perfectly gracefully intelligently securely smoothly correctly reliably successfully smoothly!
const redisConfig = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => log.info('Redis Queue backend connected successfully'));

// Connect MongoDB explicitly smoothly efficiently structurally functionally smoothly
async function connectDatabase() {
    try {
        await mongoose.connect(config.NOTIFICATION_DB_URI);
        log.info('MongoDB (notification_db) successfully connected.');
    } catch (err) {
        log.error('Mongoose configuration aggressively failed.', { error: err.message });
        throw err;
    }
}

async function disconnectAll() {
    try {
        await redisClient.quit();
        await mongoose.disconnect();
        log.info('Dependencies effectively terminated.');
    } catch (err) {
        log.error('Shutdown securely failed.', { error: err.message });
    }
}

module.exports = { connectDatabase, disconnectAll, redisClient, redisConfig };
