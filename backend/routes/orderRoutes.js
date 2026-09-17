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

/* =========================================================
   HELPER: GET CURRENT SELLING PRICE
========================================================= */

function getEffectivePrice(product) {
  const now = new Date();

  const flashSaleActive =
    product.isFlashSale &&
    Number(product.salePrice) > 0 &&
    (!product.saleStart ||
      now >= new Date(product.saleStart)) &&
    (!product.saleEnd ||
      now <= new Date(product.saleEnd));

  if (flashSaleActive) {
    return Number(product.salePrice);
  }

  return Number(product.price);
}

/* =========================================================
   CREATE ORDER
   IMPORTANT:
   PRICE AND STOCK ARE ALWAYS VERIFIED FROM DATABASE
========================================================= */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      couponCode,
      rewardPointsUsed,
      paymentMethod,
    } = req.body;

    if (
      !customer ||
      !shippingAddress ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Customer, shipping address and items are required",
      });
    }

    /* =====================================================
       VALIDATE PRODUCTS + PRICES + STOCK
    ===================================================== */

    const validatedItems = [];

    for (const item of items) {
      const productId = item.productId || item.id;

      const quantity = Number(item.quantity);

      if (!productId) {
        return res.status(400).json({
          message: "Product ID is required for every item",
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Invalid product quantity",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: "One of the products no longer exists",
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          message: `${product.name} is currently unavailable`,
        });
      }

      /* ---------------------------------------------------
         STOCK CHECK
      --------------------------------------------------- */

      if (Number(product.stock) < quantity) {
        return res.status(409).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
          productId: product._id,
          availableStock: product.stock,
        });
      }

      /* ---------------------------------------------------
         CURRENT DATABASE PRICE
      --------------------------------------------------- */

      const currentPrice = getEffectivePrice(product);

      /*
       * We intentionally DO NOT use:
       *
       * item.price
       *
       * because frontend values can be modified.
       */

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: currentPrice,
        originalPrice: Number(product.price),
        salePrice: Number(product.salePrice || 0),
        isFlashSale: Boolean(product.isFlashSale),
        image: product.image,
        size: item.size,
        quantity,
      });
    }

    /* =====================================================
       CALCULATE SUBTOTAL FROM DATABASE PRICES
    ===================================================== */

    const calculatedSubtotal = Number(
      validatedItems
        .reduce(
          (total, item) =>
            total +
            item.price * item.quantity,
          0
        )
        .toFixed(2)
    );

    /* =====================================================
       COUPON
    ===================================================== */

    let couponDiscount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const normalizedCode = String(couponCode)
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

      if (
        coupon.expiryDate &&
        new Date(coupon.expiryDate) <= new Date()
      ) {
        return res.status(400).json({
          message: "This coupon has expired",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message:
            "This coupon has reached its usage limit",
        });
      }

      if (
        calculatedSubtotal <
        Number(coupon.minimumOrderAmount || 0)
      ) {
        return res.status(400).json({
          message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
        });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount =
          (calculatedSubtotal *
            Number(coupon.discountValue)) /
          100;

        if (
          coupon.maximumDiscount !== null &&
          coupon.maximumDiscount !== undefined &&
          couponDiscount >
            Number(coupon.maximumDiscount)
        ) {
          couponDiscount =
            Number(coupon.maximumDiscount);
        }
      } else {
        couponDiscount =
          Number(coupon.discountValue) || 0;
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

    /* =====================================================
       REWARD POINTS
    ===================================================== */

    let usedRewardPoints =
      Number(rewardPointsUsed) || 0;

    if (usedRewardPoints < 0) {
      usedRewardPoints = 0;
    }

    usedRewardPoints =
      Math.floor(usedRewardPoints);

    const amountAfterCoupon = Math.max(
      0,
      calculatedSubtotal - couponDiscount
    );

    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const availableRewardPoints =
      Number(user.rewardPoints || 0);

    if (
      usedRewardPoints >
      availableRewardPoints
    ) {
      return res.status(400).json({
        message:
          "You do not have enough reward points",
      });
    }

    const maximumUsablePoints =
      Math.floor(amountAfterCoupon);

    if (
      usedRewardPoints >
      maximumUsablePoints
    ) {
      return res.status(400).json({
        message: `Maximum usable reward points are ${maximumUsablePoints}`,
      });
    }

    const rewardDiscount = Number(
      usedRewardPoints.toFixed(2)
    );

    /* =====================================================
       FINAL TOTAL
    ===================================================== */

    const finalAmount = Number(
      Math.max(
        0,
        amountAfterCoupon - rewardDiscount
      ).toFixed(2)
    );

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    const order = new Order({
      userId: req.user.userId,

      customer,
      shippingAddress,

      /*
       * Store DATABASE-VERIFIED items
       */
      items: validatedItems,

      subtotal: calculatedSubtotal,

      couponCode: appliedCouponCode,
      couponDiscount,

      rewardPointsUsed: usedRewardPoints,
      rewardDiscount,

      rewardPointsEarned: 0,

      totalAmount: finalAmount,

      paymentMethod:
        paymentMethod || "online",

      paymentStatus: "pending",
      orderStatus: "pending",

      inventoryDeducted: false,
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

/* =========================================================
   GET ALL ORDERS
========================================================= */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

/* =========================================================
   GET LOGGED-IN USER ORDERS
========================================================= */

router.get(
  "/my-orders",
  authMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find({
        userId: req.user.userId,
      })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json(orders);
    } catch (error) {
      console.error(
        "My orders error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch your orders",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   GET SINGLE ORDER
========================================================= */

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
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
      console.error(
        "Get single order error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch order",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   CREATE RAZORPAY PAYMENT ORDER
========================================================= */

router.post(
  "/:id/payment",
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

      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          message: "Order is already paid",
        });
      }

      if (Number(order.totalAmount) <= 0) {
        return res.status(400).json({
          message:
            "Invalid payment amount",
        });
      }

      /* ---------------------------------------------------
         FINAL STOCK CHECK BEFORE PAYMENT
      --------------------------------------------------- */

      for (const item of order.items) {
        const product = await Product.findById(
          item.productId
        );

        if (!product) {
          return res.status(404).json({
            message:
              `${item.name} is no longer available`,
          });
        }

        if (!product.isActive) {
          return res.status(400).json({
            message:
              `${product.name} is currently unavailable`,
          });
        }

        if (
          Number(product.stock) <
          Number(item.quantity)
        ) {
          return res.status(409).json({
            message:
              `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
          });
        }
      }

      const razorpayOrder =
        await razorpay.orders.create({
          amount: Math.round(
            Number(order.totalAmount) * 100
          ),
          currency: "INR",
          receipt: order._id.toString(),
        });

      order.razorpayOrderId =
        razorpayOrder.id;

      await order.save();

      res.status(200).json({
        message:
          "Razorpay order created",
        razorpayOrder,
        keyId:
          process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error(
        "Razorpay order creation error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create Razorpay order",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   VERIFY RAZORPAY PAYMENT
========================================================= */

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

      /* ---------------------------------------------------
         DUPLICATE PAYMENT PROTECTION
      --------------------------------------------------- */

      if (order.paymentStatus === "paid") {
        return res.status(200).json({
          message:
            "Payment already verified",
          order,
        });
      }

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          message:
            "Payment verification details are incomplete",
        });
      }

      /* ---------------------------------------------------
         RAZORPAY ORDER ID CHECK
      --------------------------------------------------- */

      if (
        razorpay_order_id !==
        order.razorpayOrderId
      ) {
        return res.status(400).json({
          message:
            "Invalid Razorpay order ID",
        });
      }

      /* ---------------------------------------------------
         SIGNATURE VERIFICATION
      --------------------------------------------------- */

      const generatedSignature =
        crypto
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

      if (
        generatedSignature !==
        razorpay_signature
      ) {
        return res.status(400).json({
          message:
            "Payment verification failed",
        });
      }

      /* ===================================================
         INVENTORY DEDUCTION
         ATOMIC PER PRODUCT
      =================================================== */

      const deductedItems = [];

      for (const item of order.items) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: item.productId,
              isActive: true,
              stock: {
                $gte: Number(item.quantity),
              },
            },
            {
              $inc: {
                stock:
                  -Number(item.quantity),
              },
            },
            {
              new: true,
            }
          );

        if (!updatedProduct) {
          /*
           * Roll back previously deducted products
           */

          for (const deducted of deductedItems) {
            await Product.findByIdAndUpdate(
              deducted.productId,
              {
                $inc: {
                  stock:
                    Number(deducted.quantity),
                },
              }
            );
          }

          return res.status(409).json({
            message:
              `Insufficient stock for ${item.name}. Payment was verified, but inventory could not be reserved. Please contact support if payment was charged.`,
          });
        }

        deductedItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      order.inventoryDeducted = true;

      /* ===================================================
         REWARD POINTS
      =================================================== */

      const user = await User.findById(
        order.userId
      );

      if (!user) {
        /*
         * Roll back inventory
         */

        for (const item of deductedItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(item.quantity),
              },
            }
          );
        }

        order.inventoryDeducted = false;

        await order.save();

        return res.status(404).json({
          message: "User not found",
        });
      }

      /* ---------------------------------------------------
         RECHECK REWARD POINTS
      --------------------------------------------------- */

      if (
        Number(order.rewardPointsUsed) >
        Number(user.rewardPoints || 0)
      ) {
        /*
         * Roll back inventory
         */

        for (const item of deductedItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(item.quantity),
              },
            }
          );
        }

        order.inventoryDeducted = false;

        await order.save();

        return res.status(400).json({
          message:
            "Insufficient reward points",
        });
      }

      if (order.rewardPointsUsed > 0) {
        user.rewardPoints -=
          Number(order.rewardPointsUsed);
      }

      /* ---------------------------------------------------
         EARN REWARD POINTS
      --------------------------------------------------- */

      const earnedPoints = Math.floor(
        Number(order.totalAmount) / 100
      );

      order.rewardPointsEarned =
        earnedPoints;

      user.rewardPoints +=
        earnedPoints;

      await user.save();

      /* ===================================================
         COUPON USAGE
      =================================================== */

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: order.couponCode,
            $or: [
              {
                usageLimit: null,
              },
              {
                usageLimit: {
                  $exists: false,
                },
              },
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

      /* ===================================================
         COMPLETE ORDER
      =================================================== */

      order.razorpayPaymentId =
        razorpay_payment_id;

      order.paymentStatus = "paid";

      order.orderStatus = "confirmed";

      await order.save();

      res.status(200).json({
        message:
          "Payment verified and order confirmed successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      res.status(500).json({
        message:
          "Payment verification failed",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   CANCEL ORDER
========================================================= */

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

      /* ---------------------------------------------------
         CHECK STATUS
      --------------------------------------------------- */

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

      /* ===================================================
         REFUND
      =================================================== */

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
                  Number(order.totalAmount) *
                    100
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
            error:
              refundError.message,
          });
        }
      }

      /* ===================================================
         RESTORE INVENTORY
      =================================================== */

      if (order.inventoryDeducted) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(item.quantity),
              },
            }
          );
        }

        order.inventoryDeducted = false;
      }

      /* ===================================================
         RESTORE REWARD POINTS
      =================================================== */

      const user = await User.findById(
        order.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      /* Restore points used */

      if (order.rewardPointsUsed > 0) {
        user.rewardPoints +=
          Number(order.rewardPointsUsed);
      }

      /* Remove points earned */

      if (order.rewardPointsEarned > 0) {
        user.rewardPoints = Math.max(
          0,
          Number(user.rewardPoints) -
            Number(
              order.rewardPointsEarned
            )
        );
      }

      await user.save();

      /* ===================================================
         RESTORE COUPON USAGE
      =================================================== */

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: order.couponCode,
            usedCount: {
              $gt: 0,
            },
          },
          {
            $inc: {
              usedCount: -1,
            },
          }
        );
      }

      /* ===================================================
         UPDATE ORDER
      =================================================== */

      order.orderStatus = "cancelled";

      if (
        order.paymentStatus === "paid"
      ) {
        order.paymentStatus =
          "refunded";
      }

      await order.save();

      res.status(200).json({
        message:
          order.paymentStatus ===
          "refunded"
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