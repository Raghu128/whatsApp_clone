/**
 * Redis Connection Directory Service
 * 
 * Creates a centralized dictionary identifying exactly which chat-node server
 * a user's WebSocket is connected to! Operations happen in O(1).
 * 
 * Task 5.5, 5.6, 5.8
 */

const { redisClient } = require('../config/redis');
const logger = require('@whatsapp-clone/shared/utils/logger');
const log = logger.child({ service: 'chat-service', component: 'connection-directory' });

const DIRECTORY_PREFIX = 'socket:conn:';

class ConnectionDirectory {
  /**
   * Register active socket instance targeting current server ID
   */
  async registerConnection(userId, serverId) {
    try {
      await redisClient.set(`${DIRECTORY_PREFIX}${userId}`, serverId);
      log.debug('Node socket registered', { userId, serverId });
    } catch (err) {
      log.error('Failed registering socket bindings via Directory Config', { error: err.message });
    }
  }

  /**
   * Remove bindings
   */
  async removeConnection(userId) {
    try {
      await redisClient.del(`${DIRECTORY_PREFIX}${userId}`);
      log.debug('Node socket removed', { userId });
    } catch (err) {
      log.error('Failed removing socket instance from directory bindings', { error: err.message });
    }
  }

  /**
   * Retrieve bindings mapping users internally allowing custom targeted events generating 
   * isolated payload operations rather than causing extensive Pub/Sub overload metrics globally.
   * O(1) operations.
   */
  async getServerForUser(userId) {
    try {
      return await redisClient.get(`${DIRECTORY_PREFIX}${userId}`);
    } catch (err) {
      log.error('Directory lookup failed violently', { error: err.message });
      return null;
    }
  }
}

module.exports = new ConnectionDirectory();
