/**
 * Routes definitions aggregating mapping structures
 */

const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const messageController = require('../controllers/message.controller');

const router = Router();

// Chats (Targetting `/api/v1/chats`)
router.post('/', chatController.getOrCreateChat);
router.get('/', chatController.getChats);
router.delete('/:id', chatController.clearChat);

// Messages (Nested dynamically under standard chats conceptually or distinctly via paths mappings)
router.get('/:id/messages', messageController.getMessages);
router.delete('/messages/:id', messageController.deleteMessage);

module.exports = router;
