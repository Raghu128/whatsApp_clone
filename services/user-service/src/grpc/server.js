/**
 * User Service — gRPC Server
 * 
 * Exposes profile getters explicitly across network backends natively utilizing high-speed protocol buffers natively over port 50052.
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('../config/env');
const { UserProfile } = require('../models');

const log = logger.child({ service: 'user-service', component: 'grpc' });

const PROTO_PATH = path.resolve(__dirname, '../../../../shared/proto/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false, longs: String, enums: String, defaults: true, oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

async function getUserProfile(call, callback) {
  try {
    const profile = await UserProfile.findByPk(call.request.userId);
    if (!profile) return callback({ code: grpc.status.NOT_FOUND, message: 'Profile not found' });
    
    callback(null, {
      userId: profile.user_id,
      username: profile.username,
      avatarUrl: profile.avatar_url || '',
      statusMessage: profile.status_message,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, message: error.message });
  }
}

async function getGroupMembers(call, callback) {
  // Mock implementations pending specific complex many-to-many Sequelize fetching models configurations
  callback(null, { members: [] });
}

let grpcServer = null;

function startGrpcServer() {
  grpcServer = new grpc.Server();
  grpcServer.addService(userProto.UserService.service, { getUserProfile, getGroupMembers });

  const port = config.USER_GRPC_PORT || 50052;
  grpcServer.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) return log.error('gRPC failed', { error: err.message });
    log.info(`🔗 User gRPC server running on port ${boundPort}`);
  });
}

function stopGrpcServer() {
  return new Promise((r) => grpcServer ? grpcServer.tryShutdown(r) : r());
}

module.exports = { startGrpcServer, stopGrpcServer };
