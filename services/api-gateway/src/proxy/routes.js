/**
 * API Proxy Router
 * 
 * Maps inbound Gateway requests out to the respective microservices
 * using standard reverse-proxying.
 * 
 * Tasks 3.3, 3.4
 */

const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config/env');

const proxyOptions = {
  changeOrigin: true,
  logLevel: config.NODE_ENV === 'development' ? 'debug' : 'error',
  // Error handling if downstream service is offline
  onError: (err, req, res) => {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The requested downstream service is currently unavailable.',
        details: err.message,
      },
    });
  },
};

function setupProxies(app) {
  // Task 3.3 HTTP proxying
  
  // Auth Service -> 3001
  app.use('/api/v1/auth', createProxyMiddleware({
    ...proxyOptions,
    target: config.AUTH_SERVICE_URL,
  }));

  // User Service -> 3002
  app.use('/api/v1/users', createProxyMiddleware({
    ...proxyOptions,
    target: config.USER_SERVICE_URL,
  }));

  // Chat Service HTTP -> 3003
  app.use('/api/v1/chats', createProxyMiddleware({
    ...proxyOptions,
    target: config.CHAT_SERVICE_URL,
  }));

  // Presence Service -> 3004
  app.use('/api/v1/presence', createProxyMiddleware({
    ...proxyOptions,
    target: config.PRESENCE_SERVICE_URL,
  }));

  // Media Service -> 3005
  app.use('/api/v1/media', createProxyMiddleware({
    ...proxyOptions,
    target: config.MEDIA_SERVICE_URL,
  }));

  // Notification Service -> 3006
  app.use('/api/v1/notifications', createProxyMiddleware({
    ...proxyOptions,
    target: config.NOTIFICATION_SERVICE_URL,
  }));

  // Task 3.4 WebSocket proxying
  // Forward all Socket.io traffic to the Chat service
  app.use('/socket.io', createProxyMiddleware({
    ...proxyOptions,
    target: config.CHAT_SERVICE_URL,
    ws: true, // Enable proxying for WebSocket traffic
  }));
}

module.exports = { setupProxies };
