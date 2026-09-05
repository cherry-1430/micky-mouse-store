const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
    } = req.body;

    const order = new Order({
  userId: req.user.userId,

  customer,
  shippingAddress,
  items,
  totalAmount,
  paymentMethod: paymentMethod || "online",
});

    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Get all orders
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// Get orders of logged-in user
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
    })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("My orders error:", error);

    res.status(500).json({
      message: "Failed to fetch your orders",
      error: error.message,
    });
  }
});

// Get single order
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
  _id: req.params.id,
  userId: req.user.userId,
}).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

// Create Razorpay payment order
router.post("/:id/payment", authMiddleware, async (req, res) => {
  try {
   const order = await Order.findOne({
  _id: req.params.id,
  userId: req.user.userId,
});

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      message: "Razorpay order created",
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
});

// Verify Razorpay payment
// Verify Razorpay payment
router.post(
  "/:id/verify-payment",
  authMiddleware,
  async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const order = await Order.findOne({
  _id: req.params.id,
  userId: req.user.userId,
});

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const generatedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(
    order.razorpayOrderId + "|" + razorpay_payment_id
  )
  .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    res.status(200).json({
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

module.exports = router;