const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/* =========================================================
   GET ALL ORDERS - ADMIN ONLY
========================================================= */

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

/* =========================================================
   UPDATE ORDER STATUS - ADMIN ONLY
========================================================= */

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
      order.orderStatus = status;

// Keep delivery status synchronized with order status
const deliveryStatusMap = {
  pending: "pending",
  confirmed: "assigned",
  processing: "assigned",
  shipped: "in_transit",
  delivered: "delivered",
  cancelled: "cancelled",
};

if (deliveryStatusMap[status]) {
  order.deliveryStatus = deliveryStatusMap[status];
}

await order.save();

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

/* =========================================================
   UPDATE DELIVERY METHOD - ADMIN ONLY
========================================================= */

// =========================================================
// UPDATE DELIVERY METHOD - ADMIN ONLY
// =========================================================

router.patch(
  "/orders/:id/delivery",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { deliveryMethod } = req.body;

      console.log("========== DELIVERY UPDATE ==========");
      console.log("Order ID:", req.params.id);
      console.log("Received deliveryMethod:", deliveryMethod);

      // Validate
      if (
        !["own_delivery", "courier"].includes(
          deliveryMethod
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid delivery method. Use own_delivery or courier.",
        });
      }

      // Find order
      const order = await Order.findById(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // Save delivery method
      order.deliveryMethod = deliveryMethod;

      // If own delivery, clear courier details
      if (deliveryMethod === "own_delivery") {
        order.shippingProvider = null;
        order.trackingId = null;
        order.deliveryStatus = "pending";
      }

      // If courier, keep courier details ready
      if (deliveryMethod === "courier") {
        if (!order.deliveryStatus) {
          order.deliveryStatus = "pending";
        }
      }

      await order.save();

      console.log(
        "Saved deliveryMethod:",
        order.deliveryMethod
      );

      console.log(
        "Saved shippingProvider:",
        order.shippingProvider
      );

      console.log(
        "Saved trackingId:",
        order.trackingId
      );

      console.log(
        "Saved deliveryStatus:",
        order.deliveryStatus
      );

      console.log("====================================");

      return res.status(200).json({
        message:
          "Delivery method updated successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Delivery update error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update delivery method",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   DELETE ORDER - ADMIN ONLY
========================================================= */

router.delete(
  "/orders/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const order = await Order.findById(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      await Order.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        message:
          "Order deleted successfully",

        orderId:
          req.params.id,
      });
    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete order",

        error:
          error.message,
      });
    }
  }
);

module.exports = router;