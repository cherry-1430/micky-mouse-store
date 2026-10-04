const express = require("express");

const router = express.Router();

const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  updateConversationStatus,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

// ===============================
// CUSTOMER SUPPORT
// ===============================

// Customer creates conversation
router.post(
  "/conversations",
  authMiddleware,
  createConversation
);

// Get conversations
router.get(
  "/conversations",
  authMiddleware,
  getConversations
);

// Get messages
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  getMessages
);

// Send message
router.post(
  "/messages",
  authMiddleware,
  sendMessage
);

// Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  authMiddleware,
  markConversationRead
);

// Update conversation status
router.patch(
  "/conversations/:conversationId/status",
  authMiddleware,
  updateConversationStatus
);

module.exports = router;