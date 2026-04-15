/**
 * Chat Service — Application Entry Point
 * 
 * Replaces generic Base Template server startup handling specific WebSockets hooks properly overriding Native Express interactions seamlessly wrapping HTTP Servers around Socket classes securely!
 */

require('dotenv').config();

const http = require('http');
const { createBaseApp } = require('@whatsapp-clone/shared/templates/baseApp');

const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { disconnectRedis } = require('./config/redis');
const SocketServer = require('./socket/server');
const chatRoutes = require('./routes/chat.routes');

const { app, log, mountErrorHandler } = createBaseApp({
  serviceName: 'chat-service',
});

// App bindings natively
app.use('/api/v1/chats', chatRoutes);
mountErrorHandler();

async function bootstrap() {
  try {
    await connectDatabase();

    // Create explicit HTTP binding handling Websocket interactions natively globally replacing standard Base Template startup parameters mapping complex HTTP definitions securely.
    const httpServer = http.createServer(app);
    
    // Bind Socket hook configurations safely natively
    new SocketServer(httpServer);

    httpServer.listen(config.CHAT_SERVICE_PORT, () => {
      log.info(`🚀 chat-service REST & WebSocket running on port ${config.CHAT_SERVICE_PORT}`);
    });

    // Handle Shutdown mappings safely resolving identical variables mapped standardizing procedures natively gracefully
    const shutdown = async () => {
      log.info('Shutting down Chat Service...');
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    log.error('Failed to initialize Chat Configurations identically', { error: err.message });
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
