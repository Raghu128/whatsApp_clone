/**
 * MongoDB Configuration
 */

const mongoose = require('mongoose');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('./env');

const log = logger.child({ service: 'chat-service', component: 'database' });

async function connectDatabase() {
  try {
    // Connect to MongoDB without deprecated warning options
    await mongoose.connect(config.CHAT_DB_URI);
    log.info('MongoDB (chat_db) connection established successfully');
  } catch (error) {
    log.error('Unable to connect to MongoDB', { error: error.message });
    throw error;
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    log.info('MongoDB (chat_db) connection closed');
  } catch (error) {
    log.error('Error closing MongoDB connection', { error: error.message });
  }
}

mongoose.connection.on('disconnected', () => {
  log.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  log.info('MongoDB connection re-established');
});

module.exports = { connectDatabase, disconnectDatabase };
