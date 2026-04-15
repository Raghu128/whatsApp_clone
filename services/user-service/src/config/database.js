/**
 * User Service — PostgreSQL Database Configuration
 * 
 * Sequelize connection to user_db.
 */

const { Sequelize } = require('sequelize');
const logger = require('@whatsapp-clone/shared/utils/logger');

const log = logger.child({ service: 'user-service', component: 'database' });
const config = require('./env');

const sequelize = new Sequelize(
  config.USER_DB_NAME,
  config.USER_DB_USER,
  config.USER_DB_PASSWORD,
  {
    host: config.USER_DB_HOST,
    port: config.USER_DB_PORT,
    dialect: 'postgres',
    logging: (msg) => log.debug(msg),
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    log.info('PostgreSQL (user_db) connection established successfully');

    if (config.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      log.info('User Database models synced');
    }
  } catch (error) {
    log.error('Unable to connect to PostgreSQL (user_db)', { error: error.message });
    throw error;
  }
}

async function disconnectDatabase() {
  try {
    await sequelize.close();
    log.info('PostgreSQL (user_db) connection closed');
  } catch (error) {
    log.error('Error closing user database connection', { error: error.message });
  }
}

module.exports = { sequelize, connectDatabase, disconnectDatabase };
