/**
 * Socket.io JWT Authentication Middleware
 * 
 * Intercepts websocket handshake components natively verifying payloads against the identical
 * internal mappings structured throughout API Gateway architectures perfectly blindly guaranteeing auth securely.
 * 
 * Task 5.7
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('@whatsapp-clone/shared/utils/logger');
const log = logger.child({ service: 'chat-service', component: 'socket-auth' });

function socketAuthMiddleware(socket, next) {
  try {
    // Allows extraction from headers or authorization objects natively
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      log.warn('Socket connection rejected dynamically: Missing Token');
      return next(new Error('Authentication Error: Missing Token'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!decoded.userId) {
      return next(new Error('Authentication Error: Invalid Payload'));
    }

    // Embed bindings natively into Socket object
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    
    next();
  } catch (err) {
    log.error('Socket authentication entirely failed', { error: err.message });
    next(new Error('Authentication Error: Validation properties entirely rejected'));
  }
}

module.exports = socketAuthMiddleware;
