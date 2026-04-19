/**
 * Message Controller
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const { decrypt } = require('@whatsapp-clone/shared/utils/encryption');
const config = require('../config/env');
const Message = require('../models/Message');

const messageController = {
  async getMessages(req, res, next) {
    try {
      const { id: chatRoomId } = req.params;
      const { cursor } = req.query; // Used for pagination

      const query = { chatRoomId };
      if (cursor) query.createdAt = { $lt: new Date(cursor) };

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      // Decrypt contents dynamically returning cleanly
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
