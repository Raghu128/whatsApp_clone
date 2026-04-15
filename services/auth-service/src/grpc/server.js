/**
 * Auth Service — gRPC Server
 * 
 * Exposes validateToken() and getUserCredentials() RPCs
 * for other services to call synchronously.
 * 
 * Task 2.12: gRPC server
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('@whatsapp-clone/shared/utils/logger');

const tokenService = require('../services/token.service');
const authService = require('../services/auth.service');
const config = require('../config/env');

const log = logger.child({ service: 'auth-service', component: 'grpc' });

// Load proto file
const PROTO_PATH = path.resolve(__dirname, '../../../../shared/proto/auth.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,    // Convert to camelCase
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// ── RPC Implementations ──

/**
 * Validate a JWT token.
 * Called by API Gateway and other services.
 */
async function validateToken(call, callback) {
  try {
    const { token } = call.request;

    // Check blacklist
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return callback(null, {
        valid: false,
        userId: '',
        username: '',
        errorMessage: 'Token has been revoked',
      });
    }

    // Verify JWT
    const decoded = tokenService.verifyAccessToken(token);

    callback(null, {
      valid: true,
      userId: decoded.userId,
      username: decoded.username,
      errorMessage: '',
    });
  } catch (error) {
    log.error('gRPC validateToken error', { error: error.message });
    callback(null, {
      valid: false,
      userId: '',
      username: '',
      errorMessage: error.message,
    });
  }
}

/**
 * Get user credentials by userId.
 * For internal service-to-service use only.
 */
async function getUserCredentials(call, callback) {
  try {
    const { userId } = call.request;
    const user = await authService.getUserById(userId);

    callback(null, {
      userId: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email || '',
      isActive: user.is_active,
      createdAt: user.created_at?.toISOString() || '',
    });
  } catch (error) {
    log.error('gRPC getUserCredentials error', { error: error.message });
    callback({
      code: grpc.status.NOT_FOUND,
      message: error.message,
    });
  }
}

// ── Server Setup ──

let grpcServer = null;

/**
 * Start the gRPC server.
 */
function startGrpcServer() {
  grpcServer = new grpc.Server();

  grpcServer.addService(authProto.AuthService.service, {
    validateToken,
    getUserCredentials,
  });

  const port = config.AUTH_GRPC_PORT || 50051;

  grpcServer.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        log.error('Failed to start gRPC server', { error: error.message });
        return;
      }
      log.info(`🔗 Auth gRPC server running on port ${boundPort}`);
    }
  );
}

/**
 * Gracefully stop the gRPC server.
 */
function stopGrpcServer() {
  return new Promise((resolve) => {
    if (grpcServer) {
      grpcServer.tryShutdown(() => {
        log.info('gRPC server shut down');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = { startGrpcServer, stopGrpcServer };
