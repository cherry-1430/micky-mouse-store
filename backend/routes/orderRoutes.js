const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create new order
// Create new order
// Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      subtotal,
      couponCode,
      rewardPointsUsed,
      paymentMethod,
    } = req.body;

    if (
      !customer ||
      !shippingAddress ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Customer, shipping address and items are required",
      });
    }

    // ================================
    // CALCULATE SUBTOTAL
    // ================================

    const calculatedSubtotal = Number(
      items
        .reduce(
          (total, item) =>
            total +
            Number(item.price) * Number(item.quantity),
          0
        )
        .toFixed(2)
    );

    if (
      subtotal !== undefined &&
      Number(subtotal).toFixed(2) !==
        calculatedSubtotal.toFixed(2)
    ) {
      return res.status(400).json({
        message: "Invalid subtotal",
      });
    }

    // ================================
    // COUPON
    // ================================

    let couponDiscount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const normalizedCode = couponCode
        .toUpperCase()
        .trim();

      const coupon = await Coupon.findOne({
        code: normalizedCode,
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          message: "This coupon is inactive",
        });
      }

      if (new Date(coupon.expiryDate) <= new Date()) {
        return res.status(400).json({
          message: "This coupon has expired",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message:
            "This coupon has reached its usage limit",
        });
      }

      if (
        calculatedSubtotal <
        coupon.minimumOrderAmount
      ) {
        return res.status(400).json({
          message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
        });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount =
          (calculatedSubtotal *
            coupon.discountValue) /
          100;

        if (
          coupon.maximumDiscount !== null &&
          couponDiscount > coupon.maximumDiscount
        ) {
          couponDiscount =
            coupon.maximumDiscount;
        }
      } else {
        couponDiscount = coupon.discountValue;
      }

      couponDiscount = Math.min(
        couponDiscount,
        calculatedSubtotal
      );

      couponDiscount = Number(
        couponDiscount.toFixed(2)
      );

      appliedCouponCode = coupon.code;
    }

    // ================================
    // REWARD POINTS
    // ================================

    let usedRewardPoints = Number(
      rewardPointsUsed
    ) || 0;

    if (usedRewardPoints < 0) {
      usedRewardPoints = 0;
    }

    usedRewardPoints = Math.floor(
      usedRewardPoints
    );

    const amountAfterCoupon = Math.max(
      0,
      calculatedSubtotal - couponDiscount
    );

    const user = await User.findById(
      req.user.userId
    ).select("rewardPoints");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Cannot use more points than the user owns
    if (usedRewardPoints > (user.rewardPoints || 0)) {
      return res.status(400).json({
        message: "You do not have enough reward points",
      });
    }

    // Cannot use more points than the remaining order amount
    const maximumUsablePoints = Math.floor(
      amountAfterCoupon
    );

    if (
      usedRewardPoints >
      maximumUsablePoints
    ) {
      usedRewardPoints =
        maximumUsablePoints;
    }

    const rewardDiscount = Number(
      usedRewardPoints.toFixed(2)
    );

    // ================================
    // FINAL TOTAL
    // ================================

    const finalAmount = Number(
      Math.max(
        0,
        amountAfterCoupon - rewardDiscount
      ).toFixed(2)
    );

    const order = new Order({
      userId: req.user.userId,

      customer,
      shippingAddress,
      items,

      subtotal: calculatedSubtotal,

      couponCode: appliedCouponCode,
      couponDiscount,

      rewardPointsUsed: usedRewardPoints,
      rewardDiscount,

      rewardPointsEarned: 0,

      totalAmount: finalAmount,

      paymentMethod:
        paymentMethod || "online",
    });

    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error(
      "Order creation error:",
      error
    );

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

      // Find the order belonging to the logged-in user
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // Prevent duplicate payment/inventory processing
      if (order.paymentStatus === "paid") {
        return res.status(200).json({
          message: "Payment already verified",
          order,
        });
      }

      // Make sure Razorpay order matches our order
      if (razorpay_order_id !== order.razorpayOrderId) {
        return res.status(400).json({
          message: "Invalid Razorpay order ID",
        });
      }

      // Generate the expected Razorpay signature
      const generatedSignature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          order.razorpayOrderId +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

      // Verify Razorpay payment
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          message: "Payment verification failed",
        });
      }

      /*
       * DEDUCT INVENTORY
       *
       * The condition:
       *
       * stock >= quantity
       *
       * prevents stock from becoming negative.
       */

      for (const item of order.items) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                stock: -item.quantity,
              },
            },
            {
              new: true,
            }
          );

        if (!updatedProduct) {
          return res.status(409).json({
            message: `Insufficient stock for ${item.name}`,
          });
        }
      }

      // Mark inventory as deducted
      // Mark inventory as deducted
order.inventoryDeducted = true;

// ==================================
// REWARD POINTS + COUPON
// ==================================

const user = await User.findById(
  order.userId
);

if (!user) {
  return res.status(404).json({
    message: "User not found",
  });
}

// Deduct reward points actually used
if (order.rewardPointsUsed > 0) {
  if (
    (user.rewardPoints || 0) <
    order.rewardPointsUsed
  ) {
    return res.status(400).json({
      message:
        "Insufficient reward points",
    });
  }

  user.rewardPoints -=
    order.rewardPointsUsed;
}

// Earn 1 point for every ₹100 actually spent
const earnedPoints = Math.floor(
  order.totalAmount / 100
);

order.rewardPointsEarned =
  earnedPoints;

// Add newly earned points
user.rewardPoints += earnedPoints;

await user.save();

// ==================================
// INCREMENT COUPON USAGE
// ==================================

if (order.couponCode) {
  await Coupon.findOneAndUpdate(
    {
      code: order.couponCode,
      $or: [
        { usageLimit: null },
        {
          $expr: {
            $lt: [
              "$usedCount",
              "$usageLimit",
            ],
          },
        },
      ],
    },
    {
      $inc: {
        usedCount: 1,
      },
    }
  );
}

// ==================================
// COMPLETE ORDER
// ==================================
order.razorpayPaymentId = razorpay_payment_id;

order.paymentStatus = "paid";
order.orderStatus = "confirmed";

await order.save();

      res.status(200).json({
        message:
          "Payment verified and inventory updated successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      res.status(500).json({
        message: "Payment verification failed",
        error: error.message,
      });
    }
  }
);

// ================================
// CANCEL ORDER
// ================================

// ================================
// CANCEL ORDER
// ================================

router.post(
  "/:id/cancel",
  authMiddleware,
  async (req, res) => {
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

      // Only these statuses can be cancelled
      if (
        ![
          "pending",
          "confirmed",
          "processing",
        ].includes(order.orderStatus)
      ) {
        return res.status(400).json({
          message:
            "This order cannot be cancelled now",
        });
      }

      // ==================================
      // REFUND PAID ORDER
      // ==================================

      if (
        order.paymentStatus === "paid" &&
        order.razorpayPaymentId
      ) {
        try {
          const refund =
            await razorpay.payments.refund(
              order.razorpayPaymentId,
              {
                amount: Math.round(
                  order.totalAmount * 100
                ),
                speed: "normal",
              }
            );

          console.log(
            "Razorpay refund created:",
            refund.id
          );
        } catch (refundError) {
          console.error(
            "Razorpay refund error:",
            refundError
          );

          return res.status(500).json({
            message:
              "Refund could not be initiated. Order was not cancelled.",
            error: refundError.message,
          });
        }
      }

      // ==================================
      // RESTORE INVENTORY
      // ==================================

      if (order.inventoryDeducted) {
        for (const item of order.items) {
          const product =
            await Product.findById(
              item.productId
            );

          if (product) {
            product.stock += item.quantity;

            await product.save();
          }
        }

        order.inventoryDeducted = false;
      }

      // ==================================
      // RESTORE REWARD POINTS USED
      // ==================================

      const user = await User.findById(
        order.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (order.rewardPointsUsed > 0) {
        user.rewardPoints +=
          order.rewardPointsUsed;
      }

      // Remove points earned from this order
      if (order.rewardPointsEarned > 0) {
        user.rewardPoints = Math.max(
          0,
          user.rewardPoints -
            order.rewardPointsEarned
        );
      }

      await user.save();

      // ==================================
      // RESTORE COUPON USAGE
      // ==================================

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: order.couponCode,
            usedCount: { $gt: 0 },
          },
          {
            $inc: {
              usedCount: -1,
            },
          }
        );
      }

      // ==================================
      // UPDATE ORDER
      // ==================================

      order.orderStatus = "cancelled";

      if (order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
      }

      await order.save();

      res.status(200).json({
        message:
          order.paymentStatus === "refunded"
            ? "Order cancelled and refund initiated successfully"
            : "Order cancelled successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to cancel order",
        error: error.message,
      });
    }
  }
);

module.exports = router;