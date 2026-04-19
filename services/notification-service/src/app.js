/**
 * Notification Service — Global Boot Entry Point
 * 
 * Task 8.1
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { connectDatabase, disconnectAll } = require('./config/database');
const { setupSubscribers, teardownSubscribers } = require('./events/subscriber');
const { setupSwagger } = require('./config/swagger');

const notificationRoutes = require('./routes/notification.routes');

const { app, log, mountErrorHandler } = createBaseApp({ serviceName: 'notification-service' });

setupSwagger(app);
app.use('/api/v1/notifications', notificationRoutes);

mountErrorHandler();

async function bootstrap() {
  try {
    await connectDatabase();
    
    // Bind EventBus correctly mappings.
    setupSubscribers();

    startServer({
      app,
      port: config.NOTIFICATION_SERVICE_PORT || 3006,
      serviceName: 'notification-service',
      log,
      onShutdown: async () => {
        log.info('Shutting down Notification Service gracefully...');
        await teardownSubscribers();
        await disconnectAll();
      },
    });
  } catch (err) {
    log.error('Bootstrap mapping failed.', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
