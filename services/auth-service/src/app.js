/**
 * Auth Service — Application Entry Point
 * 
 * Handles user registration, login, JWT token management,
 * and token revocation via Redis blacklist.
 * 
 * Port: 3001 (HTTP) / 50051 (gRPC)
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { disconnectRedis } = require('./config/redis');
const { startGrpcServer, stopGrpcServer } = require('./grpc/server');
const { setupSwagger } = require('./config/swagger');
const eventPublisher = require('./events/publisher');

// Load model associations
require('./models');

// ── Create Express App ──
const { app, log, mountErrorHandler } = createBaseApp({
  serviceName: 'auth-service',
});

// ── Swagger API Docs (Task 2.13) ──
setupSwagger(app);

// ── Routes ──
const authRoutes = require('./routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

// ── Mount Error Handler (must be last) ──
mountErrorHandler();

// ── Initialize & Start ──
async function bootstrap() {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Start gRPC server (Task 2.12)
    startGrpcServer();

    // Clean up expired refresh tokens on startup
    const tokenService = require('./services/token.service');
    await tokenService.cleanupExpiredTokens();

    // Start HTTP server
    startServer({
      app,
      port: config.AUTH_SERVICE_PORT || 3001,
      serviceName: 'auth-service',
      log,
      onShutdown: async () => {
        log.info('Shutting down Auth Service...');
        await stopGrpcServer();
        await eventPublisher.getEventBus().disconnect();
        await disconnectRedis();
        await disconnectDatabase();
        log.info('Auth Service shutdown complete');
      },
    });
  } catch (error) {
    log.error('Failed to start Auth Service', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
