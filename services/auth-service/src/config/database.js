/**
 * Auth Service — PostgreSQL Database Configuration
 * 
 * Sequelize connection to auth_db.
 * Contains auth_users and refresh_tokens tables.
 */

const { Sequelize } = require('sequelize');
const logger = require('@whatsapp-clone/shared/utils/logger');

const log = logger.child({ service: 'auth-service', component: 'database' });

const config = require('./env');

const sequelize = new Sequelize(
  config.AUTH_DB_NAME,
  config.AUTH_DB_USER,
  config.AUTH_DB_PASSWORD,
  {
    host: config.AUTH_DB_HOST,
    port: config.AUTH_DB_PORT,
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
      underscored: true,  // Use snake_case column names
      freezeTableName: true,
    },
  }
);

/**
 * Test database connection and sync models.
 */
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    log.info('PostgreSQL (auth_db) connection established successfully');

    // Sync models in development (creates tables if they don't exist)
    if (config.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      log.info('Database models synced');
    }
  } catch (error) {
    log.error('Unable to connect to PostgreSQL (auth_db)', {
      error: error.message,
      host: config.AUTH_DB_HOST,
      port: config.AUTH_DB_PORT,
    });
    throw error;
  }
}

/**
 * Gracefully close the database connection.
 */
async function disconnectDatabase() {
  try {
    await sequelize.close();
    log.info('PostgreSQL (auth_db) connection closed');
  } catch (error) {
    log.error('Error closing database connection', { error: error.message });
  }
}

module.exports = { sequelize, connectDatabase, disconnectDatabase };
