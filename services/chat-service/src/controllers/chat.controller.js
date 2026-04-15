/**
 * Chat Controller
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const ChatRoom = require('../models/ChatRoom');

const chatController = {
  async getOrCreateChat(req, res, next) {
    try {
      const { targetUserId } = req.body;
      const currentUserId = req.headers['x-user-id'];

      let room = await ChatRoom.findOne({
        type: 'private',
        participants: { $all: [currentUserId, targetUserId] }
      });

      if (!room) {
        room = await ChatRoom.create({
          type: 'private',
          participants: [currentUserId, targetUserId]
        });
      }

      return success(res, room, 'Chat retrieved', 201);
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
