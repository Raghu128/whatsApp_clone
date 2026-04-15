/**
 * Notification Controller
 * 
 * Tasks 8.9, 8.10, 8.11, 8.12
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const Notification = require('../models/Notification');

const notificationController = {
  // Task 8.9
  async getNotifications(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      
      const notifications = await Notification.find({ userId: currentUserId })
        .sort({ createdAt: -1 })
        .limit(50);
        
      return success(res, notifications, 'Notifications retrieved');
    } catch (err) { next(err); }
  },

  // Task 8.12
  async getUnreadCount(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      const count = await Notification.countDocuments({ userId: currentUserId, isRead: false });
      return success(res, { count }, 'Unread count retrieved');
    } catch (err) { next(err); }
  },

  // Task 8.10
  async markAsRead(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: currentUserId },
        { isRead: true },
        { new: true }
      );

      return success(res, notification, 'Notification marked as read');
    } catch (err) { next(err); }
  },

  // Task 8.11
  async markAllAsRead(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      
      await Notification.updateMany(
        { userId: currentUserId, isRead: false },
        { isRead: true }
      );

      return success(res, null, 'All notifications marked as read', 200);
    } catch (err) { next(err); }
  }
};

module.exports = notificationController;
