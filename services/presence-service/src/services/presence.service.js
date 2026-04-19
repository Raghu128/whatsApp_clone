/**
 * Presence Logic Operations
 * 
 * Task 6.3 - 6.5
 */

const { redisClient } = require('../config/redis');
const eventPublisher = require('../events');

const ONLINE_PREFIX = 'presence:online:';
const LASTSEEN_PREFIX = 'presence:lastseen:';
const TYPING_PREFIX = 'presence:typing:';

class PresenceService {
  /**
   * Heatbeat check assigning active statuses and overriding explicit offline parameters
   * Task 6.3
   */
  async updateHeartbeat(userId) {
    const isAlreadyOnline = await redisClient.exists(`${ONLINE_PREFIX}${userId}`);
    
    // Set explicit TTL -> 30 seconds globally safely tracking drops
    await redisClient.setex(`${ONLINE_PREFIX}${userId}`, 30, 'active');
    
    // Task 6.4 - Store a persistent un-expiring value tracing exactly the last timestamp natively
    const now = new Date().toISOString();
    await redisClient.set(`${LASTSEEN_PREFIX}${userId}`, now);
    
    if (!isAlreadyOnline) {
      // Trigger status transitions naturally! (Task 6.9)
      eventPublisher.publishUserOnline({ userId, timestamp: now });
    }
    
    return { status: 'online', lastSeen: now };
  }

  /**
   * Assigning typing states safely mapping constraints TTL 3s natively naturally (Task 6.5)
   */
  async updateTyping(userId, chatRoomId) {
    await redisClient.setex(`${TYPING_PREFIX}${chatRoomId}:${userId}`, 3, 'typing');
    // Ensure LastSeen overlaps properly matching typing interactions 
    await this.updateHeartbeat(userId); 
  }

  /**
   * Query single user natively verifying TTLs returning online parameters safely (Task 6.6)
   */
  async getUserStatus(userId) {
    const isOnline = await redisClient.exists(`${ONLINE_PREFIX}${userId}`);
    const typingKeys = await redisClient.keys(`${TYPING_PREFIX}*:${userId}`);
    const lastSeenStr = await redisClient.get(`${LASTSEEN_PREFIX}${userId}`);

    return {
      userId,
      isOnline: isOnline === 1,
      isTyping: typingKeys.length > 0,
      lastSeen: lastSeenStr || null,
    };
  }

  /**
   * Explicitly query properties across Mappings evaluating multi-keys via pipeline efficiently (Task 6.7)
   */
  async getBulkStatus(userIds) {
    if (!userIds || userIds.length === 0) return [];

    const pipeline = redisClient.pipeline();
    
    userIds.forEach(id => {
      pipeline.exists(`${ONLINE_PREFIX}${id}`);
      pipeline.get(`${LASTSEEN_PREFIX}${id}`);
    });

    const results = await pipeline.exec();
    const statuses = [];

    // Parse logic evaluating arrays directly mapping safely
    for (let i = 0; i < userIds.length; i++) {
        // pipeline.exec() returns array of [err, result] objects 
        const isOnline = results[i * 2][1] === 1;
        const lastSeen = results[i * 2 + 1][1];

        statuses.push({
            userId: userIds[i],
            isOnline,
            lastSeen: lastSeen || null
        });
    }

    return statuses;
  }
}

module.exports = new PresenceService();
