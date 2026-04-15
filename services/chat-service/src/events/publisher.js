/**
 * Socket.io Event Publisher
 * 
 * Publishes events (via identical pub/sub setups) verifying exactly who generated actions natively.
 * 
 * Task 5.26: message.sent, message.delivered, message.read
 */

const EventBus = require('@whatsapp-clone/shared/events/eventBus');
const EVENT_NAMES = require('@whatsapp-clone/shared/events/eventNames');
const { validateEventPayload } = require('@whatsapp-clone/shared/events/eventSchemas');
const logger = require('@whatsapp-clone/shared/utils/logger');

const { redisClient } = require('../config/redis');

const log = logger.child({ service: 'chat-service', component: 'publisher' });

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const eventBus = new EventBus(redisConfig, 'chat-service');

const publisher = {
  async publishMessageSent(data) {
    const { isValid, error } = validateEventPayload(EVENT_NAMES.MESSAGE_SENT, data);
    if (!isValid) return log.error('Invalid payload for message.sent', { error });
    await eventBus.publish(EVENT_NAMES.MESSAGE_SENT, data);
  },

  async publishMessageDelivered(data) {
    const { isValid, error } = validateEventPayload(EVENT_NAMES.MESSAGE_DELIVERED, data);
    if (!isValid) return log.error('Invalid payload for message.delivered', { error });
    await eventBus.publish(EVENT_NAMES.MESSAGE_DELIVERED, data);
  },

  async publishMessageRead(data) {
    const { isValid, error } = validateEventPayload(EVENT_NAMES.MESSAGE_READ, data);
    if (!isValid) return log.error('Invalid payload for message.read', { error });
    await eventBus.publish(EVENT_NAMES.MESSAGE_READ, data);
  },
  
  getEventBus() {
    return eventBus;
  }
};

module.exports = publisher;
