/**
 * Push Service explicitly resolving mapping boundaries cleanly
 * Task 8.7
 */

const { redisClient } = require('../config/database');
const logger = require('@whatsapp-clone/shared/utils/logger');
const log = logger.child({ service: 'notification-service', component: 'push' });

const pushService = {
  async pushToClient(notification) {
    try {
      // Broadcast dynamically checking identically
      await redisClient.publish('socket:push_notification', JSON.stringify({
        userId: notification.userId,
        notificationId: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        body: notification.body,
        isRead: false,
        createdAt: notification.createdAt,
      }));
      log.debug('Pushed notification logic cleanly', { userId: notification.userId });
    } catch (err) {
      log.error('Push operation failed cleanly', { error: err.message });
    }
  }
};

module.exports = pushService;
