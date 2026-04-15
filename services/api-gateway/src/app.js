/**
 * API Gateway — Application Entry Point
 * 
 * Central entry point for all client requests.
 * Routes HTTP and WebSocket traffic to downstream microservices,
 * ensuring stateless JWT validation and rate limiting.
 * 
 * Port: 3000
 */

require('dotenv').config();

const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');
const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');

const config = require('./config/env');
const { disconnectRedis } = require('./config/redis');

const authMiddleware = require('./middleware/auth');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { setupProxies } = require('./proxy/routes');

// ── Create Express App ──
const { app, log, mountErrorHandler } = createBaseApp({
  serviceName: 'api-gateway',
  enableCors: true, // Handled here centrally
});

// ── Status Route ──
app.get('/api/v1/gateway/status', (_req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    version: '1.0.0',
    services: {
      auth: config.AUTH_SERVICE_URL,
      user: config.USER_SERVICE_URL,
      chat: config.CHAT_SERVICE_URL,
      presence: config.PRESENCE_SERVICE_URL,
      media: config.MEDIA_SERVICE_URL,
      notification: config.NOTIFICATION_SERVICE_URL,
    }
  });
});

// ── Rate Limiting (Task 3.9) ──
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use(generalLimiter); // Apply general limits to everything else

// ── Stateless Authorization (Task 3.5, 3.6, 3.7, 3.8) ──
app.use(authMiddleware);

// ── Service Reverse Proxy Mapping (Task 3.3, 3.4) ──
setupProxies(app);

// ── Mount Error Handler (must be last) ──
mountErrorHandler();

// ── Initialize & Start ──
async function bootstrap() {
  try {
    startServer({
      app,
      port: config.API_GATEWAY_PORT || 3000,
      serviceName: 'api-gateway',
      log,
      onShutdown: async () => {
        log.info('Shutting down API Gateway...');
        await disconnectRedis();
        log.info('Gateway shutdown complete');
      },
    });
  } catch (err) {
    log.error('Failed to start API Gateway', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
