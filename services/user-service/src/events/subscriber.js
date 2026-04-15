/**
 * Event Subscriber for User Service
 * 
 * Listens for events via Redis EventBus.
 * Primary Task 4.6: Subscribe to `user.registered` to create UserProfile.
 */

const EventBus = require('@whatsapp-clone/shared/events/eventBus');
const EVENT_NAMES = require('@whatsapp-clone/shared/events/eventNames');
const logger = require('@whatsapp-clone/shared/utils/logger');
const { UserProfile } = require('../models');

const config = require('../config/env');

const log = logger.child({ service: 'user-service', component: 'event-subscriber' });

const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
};

const eventBus = new EventBus(redisConfig, 'user-service');

async function handleUserRegistered(payload) {
  try {
    const { userId, phone, username } = payload;
    
    // Check if it already exists (idempotency)
    const exists = await UserProfile.findByPk(userId);
    if (!exists) {
      await UserProfile.create({
        user_id: userId,
        username,
        phone,
      });
      log.info('Auto-created user profile from event', { userId });
    } else {
      log.debug('Profile already exists, skipping creation block', { userId });
    }
  } catch (error) {
    log.error('Failed to process user.registered event', { error: error.message, payload });
  }
}

function setupSubscribers() {
  eventBus.subscribe(EVENT_NAMES.USER_REGISTERED, handleUserRegistered);
  log.info('User Service subscribed to events');
}

async function teardownSubscribers() {
  await eventBus.disconnect();
}

module.exports = { setupSubscribers, teardownSubscribers, eventBus };
