const express = require("express");

const router = express.Router();

const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} = require("../controllers/messageController");

// Customer creates conversation
router.post(
  "/conversations",
  createConversation
);

// Admin gets conversations
router.get(
  "/conversations",
  getConversations
);

// Get messages
router.get(
  "/conversations/:conversationId/messages",
  getMessages
);

// Send message
router.post(
  "/messages",
  sendMessage
);

// Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  markConversationRead
);

module.exports = router;