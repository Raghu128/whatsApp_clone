/**
 * Chat Room Model (MongoDB / Mongoose)
 * 
 * Represents private and group message containers keeping track of active participants
 * and last message states generating seamless overview renders.
 */

const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    // Array of user UUID string mapped perfectly from Profile services
    participants: {
      type: [String],
      required: true,
    },
    // Meta information for dynamic generation
    lastMessage: {
      messageId: mongoose.Schema.Types.ObjectId,
      text: String,
      senderId: String,
      createdAt: Date,
    },
    // Required if type === 'group'
    groupMetadata: {
      groupId: String, // Maps to PostgreSQL Group ID
      name: String,
      avatarUrl: String,
    },
    // Tracks when participants clear chats natively
    clearedAt: {
      type: Map,
      of: Date, // userId -> Timestamp mapping when chat was cleared
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// High performance queries identifying available chats for specific participants
chatRoomSchema.index({ participants: 1 });
// Sort by recently updated actively querying lists
chatRoomSchema.index({ updatedAt: -1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
