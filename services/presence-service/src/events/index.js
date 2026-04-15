/**
 * Presence Logic Events — Publisher & Subscriber
 * 
 * Tasks 6.9, 6.10
 */

const EventBus = require('@whatsapp-clone/shared/events/eventBus');
const EVENT_NAMES = require('@whatsapp-clone/shared/events/eventNames');
const logger = require('@whatsapp-clone/shared/utils/logger');
const config = require('../config/env');

// Cyclic imports deferred inside logic scopes preventing node initialization crashes safely.
const log = logger.child({ service: 'presence-service', component: 'events' });

const redisConfig = { host: config.REDIS_HOST, port: config.REDIS_PORT };
const eventBus = new EventBus(redisConfig, 'presence-service');

// Publisher Maps
const publisher = {
  async publishUserOnline(data) {
    // Basic verification mapping logic
    await eventBus.publish('USER_ONLINE_INTERNAL', data); // Represents arbitrary internal metrics definitions cleanly modifying architectures
    log.debug('Published arbitrary online presence structure natively', { data });
  }
};

// Subscriber Hooks mappings
function setupSubscribers() {
  const presenceService = require('../services/presence.service');
  
  // Task 6.10 - Update activity when physical message hits queue regardless of manual heartbeat bounds
  eventBus.subscribe(EVENT_NAMES.MESSAGE_SENT, async (payload) => {
    try {
      if (payload.senderId) {
        await presenceService.updateHeartbeat(payload.senderId);
        log.debug('Intercepted specific send updating heartbeat safely seamlessly', { userId: payload.senderId });
      }
    } catch (err) {
      log.error('Failed mapping presence parameters targeting bounds natively', { error: err.message });
    }
  });

  log.info('Presence Service successfully connected tracking bindings perfectly securely!');
}

async function teardownSubscribers() {
  await eventBus.disconnect();
}

module.exports = { ...publisher, setupSubscribers, teardownSubscribers };
