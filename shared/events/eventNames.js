/**
 * Central Event Name Constants
 * 
 * Single source of truth for all inter-service event names.
 * Prevents typos and enables easy discovery of all events.
 */

const EVENT_NAMES = Object.freeze({
  // Auth Service Events
  USER_REGISTERED: 'user.registered',

  // User Service Events
  USER_PROFILE_UPDATED: 'user.profile.updated',
  GROUP_MEMBER_ADDED: 'group.member.added',
  GROUP_MEMBER_REMOVED: 'group.member.removed',

  // Chat/Message Service Events
  MESSAGE_SENT: 'message.sent',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',

  // Media Service Events
  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_PROCESSING_DONE: 'media.processing.done',

  // Presence Service Events
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',

  // Notification Service Events
  NOTIFICATION_CREATED: 'notification.created',
});

module.exports = EVENT_NAMES;
