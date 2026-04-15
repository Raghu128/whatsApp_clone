/**
 * Media Service Entry Point
 * 
 * Tasks 7.1
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { disconnectRedis } = require('./config/redis');
const { setupSwagger } = require('./config/swagger');
const mediaRoutes = require('./routes/media.routes');
const storageService = require('./utils/storage'); // Initializes physical directories dynamically reliably completely gracefully

const { app, log, mountErrorHandler } = createBaseApp({ serviceName: 'media-service' });

setupSwagger(app);
app.use('/api/v1/media', mediaRoutes);

mountErrorHandler();

async function bootstrap() {
  try {
    startServer({
      app,
      port: config.MEDIA_SERVICE_PORT || 3005,
      serviceName: 'media-service',
      log,
      onShutdown: async () => {
        log.info('Shutting down Media Service...');
        await disconnectRedis();
        log.info('Media Service safely shutdown');
      },
    });
  } catch (err) {
    log.error('Failed booting exact media definitions accurately', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
