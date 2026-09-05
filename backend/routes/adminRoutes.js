const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all orders - Admin only
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("userId", "name email")
        .populate("items.productId")
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      console.error("Admin orders error:", error);

      res.status(500).json({
        message: "Failed to fetch all orders",
        error: error.message,
      });
    }
  }
);

// Update order status - Admin only
router.patch(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      order.orderStatus = status;

      await order.save();

      res.status(200).json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Order status update error:", error);

      res.status(500).json({
        message: "Failed to update order status",
        error: error.message,
      });
    }
  }
);

module.exports = router;