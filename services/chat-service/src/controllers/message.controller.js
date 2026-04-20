/**
 * Message Controller
 */

const mongoose = require('mongoose');
const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const { decrypt } = require('@whatsapp-clone/shared/utils/encryption');
const config = require('../config/env');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

const messageController = {
  async getMessages(req, res, next) {
    try {
      const { id: chatRoomId } = req.params;
      const { cursor } = req.query; // Used for pagination
      const currentUserId = req.headers['x-user-id'];

      if (!mongoose.isValidObjectId(chatRoomId)) {
        throw new AppError('Invalid chat id', 400, 'BAD_REQUEST');
      }

      const room = await ChatRoom.findById(chatRoomId);
      if (!room) throw new AppError('Chat not found', 404, 'NOT_FOUND');
      if (!room.participants.includes(currentUserId)) {
        throw new AppError('Not a participant', 403, 'FORBIDDEN');
      }

      // Respect per-user "clear chat" marker: hide anything older than it
      const clearedAt = room.clearedAt.get(currentUserId);

      const createdAtFilter = {};
      if (clearedAt) createdAtFilter.$gt = clearedAt;
      if (cursor) createdAtFilter.$lt = new Date(cursor);

      const query = { chatRoomId };
      if (Object.keys(createdAtFilter).length) query.createdAt = createdAtFilter;
      // Respect per-user "delete for me" marker on individual messages
      query.deletedFor = { $ne: currentUserId };

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      const decryptedMessages = messages.map(msg => {
        const doc = msg.toJSON();
        doc.content = decrypt(doc.content);
        return doc;
      });

      return success(res, decryptedMessages, 'Messages retrieved');
    } catch (err) { next(err); }
  },

  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const message = await Message.findById(id);
      if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');

      // Add user to deletedFor logic simulating 'delete for me' cleanly
      if (!message.deletedFor.includes(req.headers['x-user-id'])) {
        message.deletedFor.push(req.headers['x-user-id']);
        await message.save();
      }

      return success(res, null, 'Message deleted');
    } catch (err) { next(err); }
  },
};

module.exports = messageController;
