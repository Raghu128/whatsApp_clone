/**
 * Chat Controller
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const ChatRoom = require('../models/ChatRoom');
const userGrpcClient = require('../grpc/userClient');

const chatController = {
  async getOrCreateChat(req, res, next) {
    try {
      const { targetUserId } = req.body;
      const currentUserId = req.headers['x-user-id'];

      if (!targetUserId) {
        throw new AppError('targetUserId is required', 400, 'BAD_REQUEST');
      }
      if (targetUserId === currentUserId) {
        throw new AppError('Cannot start a chat with yourself', 400, 'INVALID_TARGET');
      }

      // Authorization: only users in your contact list can be messaged.
      // If an existing chat already exists (you added them earlier and then
      // removed them), we still allow viewing it but block creating new ones.
      const existingRoom = await ChatRoom.findOne({
        type: 'private',
        participants: { $all: [currentUserId, targetUserId] },
      });

      if (!existingRoom) {
        const { exists, isBlocked, rpcError } = await userGrpcClient.checkContact(
          currentUserId,
          targetUserId
        );

        if (rpcError) {
          throw new AppError(
            'Could not verify contact relationship. Please try again.',
            503,
            'USER_SERVICE_UNAVAILABLE'
          );
        }
        if (!exists) {
          throw new AppError(
            'You can only chat with users in your contact list. Add them as a contact first.',
            403,
            'NOT_A_CONTACT'
          );
        }
        if (isBlocked) {
          throw new AppError(
            'You have blocked this contact. Unblock them to send messages.',
            403,
            'CONTACT_BLOCKED'
          );
        }
      }

      const room = existingRoom || await ChatRoom.create({
        type: 'private',
        participants: [currentUserId, targetUserId],
      });

      return success(res, room, 'Chat retrieved', existingRoom ? 200 : 201);
    } catch (err) { next(err); }
  },

  async getChats(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      const rooms = await ChatRoom.find({ participants: currentUserId })
        .sort({ updatedAt: -1 })
        .limit(50);
      return success(res, rooms, 'Chats retrieved');
    } catch (err) { next(err); }
  },

  async clearChat(req, res, next) {
    try {
      const currentUserId = req.headers['x-user-id'];
      const { id } = req.params;

      const room = await ChatRoom.findById(id);
      if (!room) throw new AppError('Chat not found', 404, 'NOT_FOUND');

      const cleared = room.clearedAt.get(currentUserId) || new Date(0);
      room.clearedAt.set(currentUserId, new Date());
      await room.save();

      return success(res, null, 'Chat cleared');
    } catch (err) { next(err); }
  }
};

module.exports = chatController;
