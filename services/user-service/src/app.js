/**
 * User Service — Application Entry Point
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { setupSubscribers, teardownSubscribers } = require('./events/subscriber');
const { startGrpcServer, stopGrpcServer } = require('./grpc/server');

require('./models'); // load associations natively globally 

const { app, log, mountErrorHandler } = createBaseApp({
  serviceName: 'user-service',
});

// Primary application routing mappings
const userRoutes = require('./routes/user.routes');
// Any requests to /api/v1/users will arrive naturally from the Gateway Proxy configurations matching natively

app.use('/api/v1/users', userRoutes);

mountErrorHandler();

async function bootstrap() {
  try {
    await connectDatabase();
    
    // Begin gRPC hooks natively
    startGrpcServer();

    // Attach Event Bus listening sequences cleanly natively over Redis logic
    setupSubscribers();

    startServer({
      app,
      port: config.USER_SERVICE_PORT || 3002,
      serviceName: 'user-service',
      log,
      onShutdown: async () => {
        log.info('Shutting down User Service...');
        await stopGrpcServer();
        await teardownSubscribers();
        await disconnectDatabase();
      },
    });
  } catch (err) {
    log.error('Failed to block startup on User Service parameters securely.', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
