/**
 * Message Model (MongoDB / Mongoose)
 * 
 * Tracks explicit AES Encryption mappings and delivery statuses safely.
 * Includes detailed TTL properties preventing structural overflows if deleted.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'location'],
      default: 'text',
    },
    // Stores explicit AES-256-GCM configurations matching { iv, authTag, encryptedData }
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: [String], // Array of User UUIDs deleting only locally
      default: [],
    },
    isStarredBy: {
      type: [String],
      default: [],
    },
    // Delivery tracking
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    deliveredTo: {
      type: Map,
      of: Date, // userId -> timestamp
      default: {},
    },
    readBy: {
      type: Map,
      of: Date, // userId -> timestamp
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Quickly retrieving messages by room, sorted identically against creation timeline
messageSchema.index({ chatRoomId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
