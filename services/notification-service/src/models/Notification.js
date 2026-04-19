/**
 * Notification Model (Mongoose)
 * 
 * Task 8.2: Specifies explicit TTL definitions accurately.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // String UUID mappings flawlessly
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['message', 'group_add', 'group_remove', 'welcome'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String, // E.g., messageId, groupId
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Task 8.2 — Expire notifications reliably
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: '30d' },  // Clean up seamlessly
    }
  }
);

// Indexes optimizing reads structurally successfully
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
