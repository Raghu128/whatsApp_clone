/**
 * Event Payload Schemas (Joi)
 * 
 * Validates event payloads before publishing and after receiving.
 * Ensures type safety across service boundaries.
 */

const Joi = require('joi');
const EVENT_NAMES = require('./eventNames');

const schemas = {
  // ── Auth Service Events ──
  [EVENT_NAMES.USER_REGISTERED]: Joi.object({
    userId: Joi.string().uuid().required(),
    phone: Joi.string().required(),
    username: Joi.string().required(),
  }),

  // ── User Service Events ──
  [EVENT_NAMES.USER_PROFILE_UPDATED]: Joi.object({
    userId: Joi.string().uuid().required(),
    changes: Joi.object().required(),
  }),

  [EVENT_NAMES.GROUP_MEMBER_ADDED]: Joi.object({
    groupId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    addedBy: Joi.string().uuid().required(),
  }),

  [EVENT_NAMES.GROUP_MEMBER_REMOVED]: Joi.object({
    groupId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  }),

  // ── Chat/Message Service Events ──
  [EVENT_NAMES.MESSAGE_SENT]: Joi.object({
    messageId: Joi.string().required(),
    chatRoomId: Joi.string().required(),
    sender: Joi.string().uuid().required(),
    receivers: Joi.array().items(Joi.string().uuid()).required(),
    type: Joi.string().valid('text', 'image', 'video', 'audio', 'document', 'location', 'contact').required(),
  }),

  [EVENT_NAMES.MESSAGE_DELIVERED]: Joi.object({
    messageId: Joi.string().required(),
    userId: Joi.string().uuid().required(),
  }),

  [EVENT_NAMES.MESSAGE_READ]: Joi.object({
    messageId: Joi.string().required(),
    userId: Joi.string().uuid().required(),
  }),

  // ── Media Service Events ──
  [EVENT_NAMES.MEDIA_UPLOADED]: Joi.object({
    mediaId: Joi.string().required(),
    url: Joi.string().uri().required(),
    thumbnailUrl: Joi.string().uri().allow(null),
    type: Joi.string().valid('image', 'video', 'audio', 'document').required(),
  }),

  [EVENT_NAMES.MEDIA_PROCESSING_DONE]: Joi.object({
    mediaId: Joi.string().required(),
    processedUrl: Joi.string().uri().required(),
  }),

  // ── Presence Service Events ──
  [EVENT_NAMES.USER_ONLINE]: Joi.object({
    userId: Joi.string().uuid().required(),
    isOnline: Joi.boolean().required(),
    lastSeen: Joi.string().isoDate().allow(null),
  }),

  [EVENT_NAMES.USER_OFFLINE]: Joi.object({
    userId: Joi.string().uuid().required(),
    isOnline: Joi.boolean().required(),
    lastSeen: Joi.string().isoDate().required(),
  }),

  // ── Notification Service Events ──
  [EVENT_NAMES.NOTIFICATION_CREATED]: Joi.object({
    userId: Joi.string().uuid().required(),
    notification: Joi.object({
      type: Joi.string().required(),
      title: Joi.string().required(),
      body: Joi.string().required(),
      data: Joi.object().allow(null),
    }).required(),
  }),
};

/**
 * Validate a payload against its event schema.
 * 
 * @param {string} eventName - Name of the event
 * @param {object} payload - Payload to validate
 * @returns {{ isValid: boolean, error: string|null, value: object }}
 */
function validateEventPayload(eventName, payload) {
  const schema = schemas[eventName];
  if (!schema) {
    return { isValid: true, error: null, value: payload };
  }

  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: false });
  if (error) {
    return {
      isValid: false,
      error: error.details.map((d) => d.message).join(', '),
      value: null,
    };
  }

  return { isValid: true, error: null, value };
}

module.exports = {
  schemas,
  validateEventPayload,
};
