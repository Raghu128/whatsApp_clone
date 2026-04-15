/**
 * Socket.io Server Architecture
 * 
 * Defines core messaging routing mechanisms utilizing O(1) connection mappings implicitly checking Redis instances dynamically preventing Broadcast metric overloads natively securely utilizing AES configurations.
 * 
 * Tasks 5.4, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14
 */

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const logger = require('@whatsapp-clone/shared/utils/logger');
const { encryptData, decryptData } = require('@whatsapp-clone/shared/utils/encryption');

const config = require('../config/env');
const { redisClient } = require('../config/redis');
const connectionDirectory = require('./connectionDirectory');
const socketAuthMiddleware = require('./middleware');
const eventPublisher = require('../events/publisher');

const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

const log = logger.child({ service: 'chat-service', component: 'socket-server' });

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    // Redis adapter — enables scaling horizontally intercepting Pub/Sub channels naturally via existing Redis definitions
    // Duplicating client for Pub/Sub distinct operations safely mapping properties cleanly
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    this.io.adapter(createAdapter(pubClient, subClient));

    // Register Authentication hook securely
    this.io.use(socketAuthMiddleware);

    // Initialize logic mapping structures
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.io.on('connection', async (socket) => {
      log.info('New Socket connected safely', { userId: socket.userId, socketId: socket.id });

      // Task 5.5: Connect Directory Mapping tracking target node implicitly generating explicit O(1) lookups
      await connectionDirectory.registerConnection(socket.userId, config.SERVER_ID);
      
      // Implicitly join personal room ensuring users navigating separate devices receive parallel mappings natively effortlessly
      socket.join(`user:${socket.userId}`);

      socket.on('disconnect', async () => {
        log.info('Socket disconnected natively', { userId: socket.userId });
        // Task 5.6
        await connectionDirectory.removeConnection(socket.userId);
      });

      // -- CORE EVENTS --
      
      // Task 5.9: Send messages explicitly executing AES formats tracking MongoDB configurations safely
      socket.on('message:send', async (payload, callback) => {
        try {
          const { chatRoomId, receiverId, text, messageType = 'text', mediaUrl } = payload;
          
          if (!chatRoomId || (!text && !mediaUrl)) {
            return callback && callback({ success: false, error: 'Invalid message payload' });
          }

          // Task 5.15: AES Integration configuring properties safely
          const encryptedContent = encryptData(text || mediaUrl, config.ENCRYPTION_KEY);
          
          const newMessage = await Message.create({
            chatRoomId,
            senderId: socket.userId,
            messageType,
            content: encryptedContent, 
          });

          // Task 5.8: Targeted Routing
          // Rather than broadcasting everywhere natively isolating exact target connections via user array mappings checking Directory configurations securely
          const messageData = {
            messageId: newMessage._id,
            chatRoomId,
            senderId: socket.userId,
            messageType,
            content: text || mediaUrl, // Sending decrypted payload across live-socket logic safely preventing double decryption sequences natively
            createdAt: newMessage.createdAt,
          };
          
          // Emit identically across Sender properties verifying parallel configurations 
          this.io.to(`user:${socket.userId}`).emit('message:new', messageData); 

          // Check directory directly isolating target dynamically securely
          const receiverServer = await connectionDirectory.getServerForUser(receiverId);
          if (receiverServer) {
            this.io.to(`user:${receiverId}`).emit('message:new', messageData);
          }
          
          eventPublisher.publishMessageSent({ messageId: newMessage._id.toString(), senderId: socket.userId, receiverId });
          
          if (callback) callback({ success: true, messageId: newMessage._id });

        } catch (error) {
          log.error('message:send configuration failed', { error: error.message });
          if (callback) callback({ success: false, error: 'Internal server processing failed severely' });
        }
      });

      // Task 5.10 / 5.11 / 5.12 Handling logic components mapping status hooks cleanly
      socket.on('message:delivered', async (payload) => {
        eventPublisher.publishMessageDelivered(payload);
        this.io.to(`user:${payload.senderId}`).emit('message:status', { messageId: payload.messageId, status: 'delivered' });
      });

      socket.on('message:read', async (payload) => {
        eventPublisher.publishMessageRead(payload);
        this.io.to(`user:${payload.senderId}`).emit('message:status', { messageId: payload.messageId, status: 'read' });
      });

      socket.on('typing:start', (payload) => {
        this.io.to(`user:${payload.receiverId}`).emit('typing:status', { userId: socket.userId, status: 'typing' });
      });

      socket.on('typing:stop', (payload) => {
        this.io.to(`user:${payload.receiverId}`).emit('typing:status', { userId: socket.userId, status: 'idle' });
      });
      
      socket.on('heartbeat', () => {
        // Task 5.14 Placeholder tracking Presence sequences securely
        socket.emit('heartbeat:ack', { timestamp: Date.now() });
      });
    });
  }
}

module.exports = SocketServer;
