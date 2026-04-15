/**
 * Redis Event Bus — Pub/Sub Wrapper
 * 
 * Provides a clean interface for inter-service event-driven communication.
 * Each service creates its own EventBus instance.
 * 
 * Usage:
 *   const { EventBus, EVENT_NAMES } = require('@whatsapp-clone/shared');
 *   
 *   const eventBus = new EventBus({
 *     host: process.env.REDIS_HOST,
 *     port: process.env.REDIS_PORT,
 *     password: process.env.REDIS_PASSWORD,
 *   });
 * 
 *   // Publish
 *   await eventBus.publish(EVENT_NAMES.USER_REGISTERED, { userId, username });
 * 
 *   // Subscribe
 *   eventBus.subscribe(EVENT_NAMES.USER_REGISTERED, async (payload) => {
 *     console.log('New user:', payload.userId);
 *   });
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

class EventBus {
  /**
   * @param {object} redisConfig - ioredis connection options
   * @param {string} [serviceName='unknown'] - Name of the service using this bus
   */
  constructor(redisConfig, serviceName = 'unknown') {
    this.serviceName = serviceName;
    this.log = logger.child({ service: serviceName, component: 'EventBus' });

    // Separate connections for pub and sub (Redis requirement)
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.handlers = new Map();
    this._setupSubscriberListener();

    this.publisher.on('connect', () => {
      this.log.info('EventBus publisher connected to Redis');
    });

    this.subscriber.on('connect', () => {
      this.log.info('EventBus subscriber connected to Redis');
    });

    this.publisher.on('error', (err) => {
      this.log.error('EventBus publisher error', { error: err.message });
    });

    this.subscriber.on('error', (err) => {
      this.log.error('EventBus subscriber error', { error: err.message });
    });
  }

  /**
   * Set up the message listener on the subscriber connection.
   * Routes messages to registered handlers.
   */
  _setupSubscriberListener() {
    this.subscriber.on('message', async (channel, message) => {
      const handlers = this.handlers.get(channel);
      if (!handlers || handlers.length === 0) return;

      let payload;
      try {
        payload = JSON.parse(message);
      } catch (err) {
        this.log.error('Failed to parse event payload', { channel, error: err.message });
        return;
      }

      this.log.debug('Event received', { event: channel, payload });

      for (const handler of handlers) {
        try {
          await handler(payload);
        } catch (err) {
          this.log.error('Event handler error', {
            event: channel,
            handler: handler.name || 'anonymous',
            error: err.message,
            stack: err.stack,
          });
        }
      }
    });
  }

  /**
   * Publish an event to a channel.
   * 
   * @param {string} eventName - Event channel name
   * @param {object} payload - Event data
   * @returns {Promise<number>} Number of subscribers that received the message
   */
  async publish(eventName, payload) {
    const enrichedPayload = {
      ...payload,
      _meta: {
        publisher: this.serviceName,
        timestamp: new Date().toISOString(),
        eventName,
      },
    };

    const message = JSON.stringify(enrichedPayload);
    const result = await this.publisher.publish(eventName, message);

    this.log.debug('Event published', { event: eventName, subscribers: result });
    return result;
  }

  /**
   * Subscribe to an event channel.
   * 
   * @param {string} eventName - Event channel name
   * @param {function} handler - Async handler function receiving the payload
   */
  subscribe(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
      this.subscriber.subscribe(eventName, (err) => {
        if (err) {
          this.log.error('Failed to subscribe to event', { event: eventName, error: err.message });
          return;
        }
        this.log.info('Subscribed to event', { event: eventName });
      });
    }

    this.handlers.get(eventName).push(handler);
  }

  /**
   * Unsubscribe from an event channel.
   * 
   * @param {string} eventName - Event channel name
   */
  unsubscribe(eventName) {
    this.handlers.delete(eventName);
    this.subscriber.unsubscribe(eventName);
    this.log.info('Unsubscribed from event', { event: eventName });
  }

  /**
   * Gracefully disconnect from Redis.
   */
  async disconnect() {
    this.log.info('EventBus disconnecting...');
    await this.publisher.quit();
    await this.subscriber.quit();
    this.log.info('EventBus disconnected');
  }
}

module.exports = EventBus;
