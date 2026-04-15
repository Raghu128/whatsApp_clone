/**
 * Auth Service — Event Publisher
 * 
 * Publishes events to Redis Pub/Sub for other services to consume.
 * Task 2.11: Publish user.registered event.
 */

const EventBus = require('@whatsapp-clone/shared/events/eventBus');
const EVENT_NAMES = require('@whatsapp-clone/shared/events/eventNames');
const { validateEventPayload } = require('@whatsapp-clone/shared/events/eventSchemas');
const logger = require('@whatsapp-clone/shared/utils/logger');

const { redisConfig } = require('../config/redis');

const log = logger.child({ service: 'auth-service', component: 'publisher' });

// Create a dedicated EventBus instance for auth service
const eventBus = new EventBus(redisConfig, 'auth-service');

const publisher = {
  /**
   * Publish user.registered event.
   * Consumed by User Service (auto-create profile) and Notification Service (welcome notification).
   * 
   * @param {object} data - { userId, phone, username }
   */
  async publishUserRegistered(data) {
    const { isValid, error } = validateEventPayload(EVENT_NAMES.USER_REGISTERED, data);
    if (!isValid) {
      log.error('Invalid event payload for user.registered', { error, data });
      return;
    }

    try {
      await eventBus.publish(EVENT_NAMES.USER_REGISTERED, data);
      log.info('Published user.registered event', { userId: data.userId });
    } catch (err) {
      log.error('Failed to publish user.registered event', { error: err.message });
    }
  },

  /**
   * Get the event bus instance (for graceful shutdown).
   */
  getEventBus() {
    return eventBus;
  },
};

module.exports = publisher;
