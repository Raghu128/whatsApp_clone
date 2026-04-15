/**
 * Presence Service — App Entrypoint Setup
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { disconnectRedis } = require('./config/redis');
const { setupSubscribers, teardownSubscribers } = require('./events/index');
const { setupSwagger } = require('./config/swagger');

const presenceRoutes = require('./routes/presence.routes');

const { app, log, mountErrorHandler } = createBaseApp({ serviceName: 'presence-service' });

setupSwagger(app);
app.use('/api/v1/presence', presenceRoutes);

mountErrorHandler();

async function bootstrap() {
  try {
    setupSubscribers(); // Hook onto EventBus completely avoiding native DB configurations 

    startServer({
      app,
      port: config.PRESENCE_SERVICE_PORT || 3004,
      serviceName: 'presence-service',
      log,
      onShutdown: async () => {
        log.info('Shutting down Presence Service...');
        await teardownSubscribers();
        await disconnectRedis();
        log.info('Shutdown completely finalized cleanly');
      },
    });
  } catch (err) {
    log.error('Failed mapping logic cleanly internally', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
