/**
 * Base Server Startup Template
 * 
 * Reusable server startup logic with graceful shutdown handling.
 * 
 * Usage:
 *   const { startServer } = require('@whatsapp-clone/shared/templates/baseServer');
 * 
 *   startServer({
 *     app,
 *     port: 3001,
 *     serviceName: 'auth-service',
 *     log,
 *     onShutdown: async () => {
 *       await db.close();
 *       await eventBus.disconnect();
 *     },
 *   });
 */

const logger = require('../utils/logger');

/**
 * Start an Express server with graceful shutdown.
 * 
 * @param {object} options
 * @param {Express.Application} options.app - Express app
 * @param {number} options.port - Port to listen on
 * @param {string} options.serviceName - Service name for logging
 * @param {winston.Logger} [options.log] - Logger instance
 * @param {function} [options.onShutdown] - Async cleanup function
 * @returns {http.Server} The HTTP server instance
 */
function startServer(options = {}) {
  const {
    app,
    port,
    serviceName,
    log = logger.child({ service: serviceName }),
    onShutdown = async () => {},
  } = options;

  const server = app.listen(port, () => {
    log.info(`🚀 ${serviceName} running on port ${port}`, {
      port,
      nodeEnv: process.env.NODE_ENV || 'development',
      pid: process.pid,
    });
  });

  // ── Graceful Shutdown ──
  const gracefulShutdown = async (signal) => {
    log.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      log.info('HTTP server closed');

      try {
        await onShutdown();
        log.info('Cleanup complete. Exiting.');
        process.exit(0);
      } catch (err) {
        log.error('Error during shutdown cleanup', { error: err.message });
        process.exit(1);
      }
    });

    // Force shutdown after 30s
    setTimeout(() => {
      log.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ── Unhandled Errors ──
  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection', { error: reason });
  });

  process.on('uncaughtException', (err) => {
    log.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  return server;
}

module.exports = { startServer };
