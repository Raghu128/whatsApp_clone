/**
 * Chat Service — gRPC Client to User Service
 *
 * Wraps the `user.UserService` protobuf service with a small,
 * promisified interface. Handles lazy connection so consumers
 * don't have to worry about start-up ordering.
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('../config/env');

const log = logger.child({ service: 'chat-service', component: 'user-grpc-client' });

const PROTO_PATH = path.resolve(__dirname, '../../../../shared/proto/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

let client = null;

function getClient() {
  if (!client) {
    client = new userProto.UserService(
      config.USER_GRPC_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
}

/**
 * Ask user-service whether `targetUserId` is in `ownerUserId`'s contact list.
 * Returns `{ exists, isBlocked }`. On RPC failure we log and fall back to a
 * conservative result (exists: false) so the caller can decide how to react.
 */
function checkContact(ownerUserId, targetUserId) {
  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + 3000); // 3s timeout
    getClient().checkContact(
      { ownerUserId, targetUserId },
      { deadline },
      (err, response) => {
        if (err) {
          log.error('gRPC checkContact failed', {
            error: err.message,
            code: err.code,
            ownerUserId,
            targetUserId,
          });
          return resolve({ exists: false, isBlocked: false, rpcError: true });
        }
        resolve({
          exists: !!response.exists,
          isBlocked: !!response.isBlocked,
          rpcError: false,
        });
      }
    );
  });
}

module.exports = { checkContact };
