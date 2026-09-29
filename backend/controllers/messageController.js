const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// CREATE CONVERSATION
exports.createConversation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      subject,
      message,
    } = req.body;

    if (!customerName || !message) {
      return res.status(400).json({
        message: "Customer name and message are required",
      });
    }

    const conversation = await Conversation.create({
      customerId: customerId || null,
      customerName,
      customerEmail,
      subject: subject || "Customer Support",
      lastMessage: message,
      lastMessageAt: new Date(),
      unreadByAdmin: true,
    });

    await Message.create({
      conversationId: conversation._id,
      senderType: "customer",
      senderId: customerId || null,
      senderName: customerName,
      message,
      isRead: false,
    });

    res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    res.status(500).json({
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

// GET ALL CONVERSATIONS
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

// GET MESSAGES OF CONVERSATION
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// SEND MESSAGE
exports.sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      senderType,
      senderId,
      senderName,
      message,
    } = req.body;

    if (!conversationId || !senderType || !senderName || !message) {
      return res.status(400).json({
        message: "Required message information is missing",
      });
    }

    const newMessage = await Message.create({
      conversationId,
      senderType,
      senderId: senderId || null,
      senderName,
      message,
      isRead: false,
    });

    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message,
        lastMessageAt: new Date(),

        ...(senderType === "customer"
          ? {
              unreadByAdmin: true,
              unreadByCustomer: false,
            }
          : {
              unreadByAdmin: false,
              unreadByCustomer: true,
            }),
      }
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// MARK CONVERSATION AS READ
exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        senderType: "customer",
      },
      {
        isRead: true,
      }
    );

    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        unreadByAdmin: false,
      }
    );

    res.json({
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Mark read error:", error);

    res.status(500).json({
      message: "Failed to mark conversation as read",
      error: error.message,
    });
  }
};