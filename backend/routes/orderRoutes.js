const express = require("express");

console.log(
  "🔥🔥🔥 ORDER ROUTES FILE LOADED - DELIVERY + RETURN VERSION 🔥🔥🔥"
);

const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

/* =========================================================
   RAZORPAY
========================================================= */

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
   HELPER: ADMIN CHECK
========================================================= */

function adminOnly(req, res, next) {
  if (
    !req.user ||
    String(req.user.role || "").toLowerCase() !== "admin"
  ) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

/* =========================================================
   CREATE ORDER
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
      deliveryMethod,
    } = req.body;

    console.log("========================================");
    console.log("🔥 CREATE ORDER ROUTE RUNNING");
    console.log("🔥 REQUEST BODY:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("========================================");

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

    /* =========================================
       VALIDATE PRODUCTS
    ========================================= */

    const validatedItems = [];

    for (const item of items) {
      const productId = item.productId || item.id;
      const quantity = Number(item.quantity);

      if (!productId) {
        return res.status(400).json({
          message: "Product ID is required",
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
          message: "Product not found",
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          message: `${product.name} is unavailable`,
        });
      }

      if (Number(product.stock) < quantity) {
        return res.status(409).json({
          message:
            `Insufficient stock for ${product.name}`,
        });
      }

      const currentPrice = getEffectivePrice(product);

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: currentPrice,
        image: product.image,
        size: item.size,
        quantity: quantity,
      });
    }

    /* =========================================
       SUBTOTAL
    ========================================= */

    const calculatedSubtotal = Number(
      validatedItems
        .reduce(
          (total, item) =>
            total +
            Number(item.price) *
              Number(item.quantity),
          0
        )
        .toFixed(2)
    );

    /* =========================================
       COUPON
    ========================================= */

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
          message:
            `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
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

    /* =========================================
       AMOUNT AFTER COUPON
    ========================================= */

    const amountAfterCoupon = Math.max(
      0,
      calculatedSubtotal - couponDiscount
    );

    /* =========================================
       DELIVERY CHARGE
    ========================================= */

    const normalizedDeliveryMethod =
      deliveryMethod === "courier"
        ? "courier"
        : "own_delivery";

    const deliveryCharge =
      calculatedSubtotal < 999 ? 100 : 0;

    /* =========================================
       USER
    ========================================= */

    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /* =========================================
       REWARD POINTS
    ========================================= */

    let usedRewardPoints =
      Number(rewardPointsUsed) || 0;

    usedRewardPoints = Math.max(
      0,
      Math.floor(usedRewardPoints)
    );

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
        message:
          `Maximum usable reward points are ${maximumUsablePoints}`,
      });
    }

    const rewardDiscount =
      Number(usedRewardPoints);

    /* =========================================
       FINAL TOTAL
    ========================================= */

    const finalAmount = Number(
      Math.max(
        0,
        calculatedSubtotal -
          couponDiscount -
          rewardDiscount +
          deliveryCharge
      ).toFixed(2)
    );

    console.log("========================================");
    console.log("FINAL BACKEND CALCULATION");
    console.log("Subtotal:", calculatedSubtotal);
    console.log("Coupon:", couponDiscount);
    console.log("Reward:", rewardDiscount);
    console.log("Delivery:", deliveryCharge);
    console.log("FINAL:", finalAmount);
    console.log("========================================");

    /* =========================================
       CREATE ORDER
    ========================================= */

    const order = new Order({
      userId: req.user.userId,

      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },

      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
      },

      items: validatedItems,

      subtotal: calculatedSubtotal,

      couponCode: appliedCouponCode,

      couponDiscount: couponDiscount,

      rewardPointsUsed: usedRewardPoints,

      rewardDiscount: rewardDiscount,

      deliveryCharge: Number(deliveryCharge || 0),

      deliveryMethod:
        normalizedDeliveryMethod,

      shippingProvider:
        normalizedDeliveryMethod === "courier"
          ? "Delhivery"
          : null,

      trackingId: null,

      deliveryStatus: "pending",

      totalAmount: Number(finalAmount),

      paymentMethod:
        paymentMethod || "online",

      paymentStatus: "pending",

      orderStatus: "pending",

      /* RETURN */

      returnStatus: "not_requested",

      returnReason: null,

      returnRequestedAt: null,

      returnProcessedAt: null,

      refundAmount: 0,

      refundId: null,
    });

    /* =========================================
       SAVE ORDER
    ========================================= */

    const savedOrder = await order.save();

    console.log("========================================");
    console.log("AFTER MONGOOSE SAVE");
    console.log("ORDER ID:", savedOrder._id);
    console.log(
      "deliveryCharge:",
      savedOrder.deliveryCharge
    );
    console.log(
      "totalAmount:",
      savedOrder.totalAmount
    );
    console.log("========================================");

    /* =========================================
       FORCE DATABASE UPDATE
    ========================================= */

    await Order.collection.updateOne(
      {
        _id: savedOrder._id,
      },
      {
        $set: {
          deliveryCharge: deliveryCharge,
          totalAmount: finalAmount,
        },
      }
    );

    /* =========================================
       READ AGAIN FROM DATABASE
    ========================================= */

    const finalOrder =
      await Order.findById(
        savedOrder._id
      ).lean();

    console.log("========================================");
    console.log("🔥 FINAL DATABASE CHECK");
    console.log(
      "Database subtotal:",
      finalOrder.subtotal
    );
    console.log(
      "Database deliveryCharge:",
      finalOrder.deliveryCharge
    );
    console.log(
      "Database couponDiscount:",
      finalOrder.couponDiscount
    );
    console.log(
      "Database rewardDiscount:",
      finalOrder.rewardDiscount
    );
    console.log(
      "Database totalAmount:",
      finalOrder.totalAmount
    );
    console.log("========================================");

    return res.status(201).json({
      message: "Order created successfully",
      order: finalOrder,
    });
  } catch (error) {
    console.error(
      "🔥 ORDER CREATION ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

/* =========================================================
   GET ALL ORDERS
========================================================= */

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const orders =
        await Order.find()
          .populate("items.productId")
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(orders);
    } catch (error) {
      console.error(
        "Get all orders error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch orders",
        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   GET LOGGED-IN USER ORDERS
========================================================= */

router.get(
  "/my-orders",
  authMiddleware,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          userId:
            req.user.userId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json(orders);
    } catch (error) {
      console.error(
        "My orders error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch your orders",
        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - GET RETURN REQUESTS
========================================================= */

router.get(
  "/admin/returns",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          returnStatus: {
            $in: [
              "requested",
              "approved",
              "picked_up",
              "received",
            ],
          },
        })
          .populate(
            "userId",
            "name email"
          )
          .populate(
            "items.productId"
          )
          .sort({
            returnRequestedAt: -1,
          });

      return res.status(200).json(
        orders
      );
    } catch (error) {
      console.error(
        "Get return requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch return requests",
        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   REQUEST RETURN
   CUSTOMER
========================================================= */

router.post(
  "/:id/return",
  authMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (
        !reason ||
        !String(reason).trim()
      ) {
        return res.status(400).json({
          message:
            "Return reason is required",
        });
      }

      const order =
        await Order.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      /* ONLY DELIVERED ORDERS */

      if (
        order.orderStatus !==
        "delivered"
      ) {
        return res.status(400).json({
          message:
            "Only delivered orders can be returned",
        });
      }

      /* PREVENT DUPLICATE RETURN */

      if (
        order.returnStatus &&
        order.returnStatus !==
          "not_requested"
      ) {
        return res.status(400).json({
          message:
            "Return request has already been submitted",
        });
      }

      order.returnStatus =
        "requested";

      order.returnReason =
        String(reason).trim();

      order.returnRequestedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Return request submitted successfully",

        order,
      });
    } catch (error) {
      console.error(
        "Return request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to submit return request",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - APPROVE RETURN
========================================================= */

router.patch(
  "/admin/:id/return/approve",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.returnStatus !==
        "requested"
      ) {
        return res.status(400).json({
          message:
            "This order does not have a pending return request",
        });
      }

      order.returnStatus =
        "approved";

      order.returnProcessedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Return request approved successfully",

        order,
      });
    } catch (error) {
      console.error(
        "Approve return error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to approve return",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - REJECT RETURN
========================================================= */

router.patch(
  "/admin/:id/return/reject",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { reason } =
        req.body;

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.returnStatus !==
        "requested"
      ) {
        return res.status(400).json({
          message:
            "This order does not have a pending return request",
        });
      }

      order.returnStatus =
        "rejected";

      if (
        reason &&
        String(reason).trim()
      ) {
        order.returnReason =
          `${order.returnReason || ""} | Admin: ${String(
            reason
          ).trim()}`;
      }

      order.returnProcessedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Return request rejected",

        order,
      });
    } catch (error) {
      console.error(
        "Reject return error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to reject return",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - MARK RETURN PICKED UP
========================================================= */

router.patch(
  "/admin/:id/return/picked-up",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.returnStatus !==
        "approved"
      ) {
        return res.status(400).json({
          message:
            "Return must be approved first",
        });
      }

      order.returnStatus =
        "picked_up";

      order.returnProcessedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Return marked as picked up",

        order,
      });
    } catch (error) {
      console.error(
        "Return pickup error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update return",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - MARK RETURN RECEIVED
========================================================= */

router.patch(
  "/admin/:id/return/received",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        ![
          "approved",
          "picked_up",
        ].includes(
          order.returnStatus
        )
      ) {
        return res.status(400).json({
          message:
            "Return is not ready to be marked as received",
        });
      }

      /* =========================================
         RESTORE STOCK
         Product is returned to inventory
      ========================================= */

      if (
        order.inventoryDeducted
      ) {
        for (
          const item of
            order.items
        ) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(
                    item.quantity
                  ),
              },
            }
          );
        }

        order.inventoryDeducted =
          false;
      }

      order.returnStatus =
        "received";

      order.returnProcessedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Returned product marked as received",

        order,
      });
    } catch (error) {
      console.error(
        "Return received error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update return status",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   ADMIN - PROCESS RETURN REFUND
========================================================= */

router.post(
  "/admin/:id/return/refund",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.returnStatus !==
        "received"
      ) {
        return res.status(400).json({
          message:
            "Product must be received before refund",
        });
      }

      if (
        order.paymentStatus !==
        "paid"
      ) {
        return res.status(400).json({
          message:
            "This order does not have a completed online payment",
        });
      }

      if (
        order.refundId
      ) {
        return res.status(400).json({
          message:
            "Refund has already been processed",
        });
      }

      if (
        !order.razorpayPaymentId
      ) {
        return res.status(400).json({
          message:
            "Razorpay payment ID not found",
        });
      }

      const refundAmount =
        Math.round(
          Number(
            order.totalAmount
          ) * 100
        );

      if (
        !Number.isFinite(
          refundAmount
        ) ||
        refundAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid refund amount",
        });
      }

      /* =========================================
         RAZORPAY REFUND
      ========================================= */

      const refund =
        await razorpay
          .payments.refund(
            order.razorpayPaymentId,
            {
              amount:
                refundAmount,

              speed:
                "normal",
            }
          );

      /* =========================================
         SAVE REFUND DETAILS
      ========================================= */

      order.returnStatus =
        "refunded";

      order.paymentStatus =
        "refunded";

      order.refundAmount =
        Number(
          order.totalAmount
        );

      order.refundId =
        refund.id;

      order.returnProcessedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        message:
          "Refund processed successfully",

        refundId:
          refund.id,

        refundAmount:
          order.refundAmount,

        order,
      });
    } catch (error) {
      console.error(
        "Return refund error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to process refund",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   DELETE ORDER
========================================================= */

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      await Order.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        message:
          "Order deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete order",

        error:
          error.message,
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
      const order =
        await Order.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        }).populate(
          "items.productId"
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      return res.status(200).json(
        order
      );
    } catch (error) {
      console.error(
        "Get single order error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch order",

        error:
          error.message,
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
      const order =
        await Order.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.status(400).json({
          message:
            "Order is already paid",
        });
      }

      /* STOCK CHECK */

      for (
        const item of
          order.items
      ) {
        const product =
          await Product.findById(
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

      /* RAZORPAY AMOUNT */

      const finalAmount =
        Number(
          order.totalAmount
        );

      const razorpayAmount =
        Math.round(
          finalAmount * 100
        );

      console.log("");
      console.log("========================================");
      console.log("       RAZORPAY PAYMENT DEBUG");
      console.log("========================================");

      console.log(
        "Order ID:",
        order._id.toString()
      );

      console.log(
        "DB Subtotal:",
        order.subtotal
      );

      console.log(
        "DB Coupon Discount:",
        order.couponDiscount
      );

      console.log(
        "DB Reward Discount:",
        order.rewardDiscount
      );

      console.log(
        "DB Delivery Charge:",
        order.deliveryCharge
      );

      console.log(
        "DB Total Amount:",
        order.totalAmount
      );

      console.log(
        "Final Amount:",
        finalAmount
      );

      console.log(
        "Razorpay Amount:",
        razorpayAmount
      );

      console.log(
        "Razorpay Amount in INR:",
        razorpayAmount / 100
      );

      console.log("========================================");

      if (
        !Number.isFinite(
          finalAmount
        ) ||
        finalAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid order amount",
        });
      }

      if (
        !Number.isInteger(
          razorpayAmount
        ) ||
        razorpayAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid Razorpay amount",
        });
      }

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            razorpayAmount,

          currency:
            "INR",

          receipt:
            order._id.toString(),
        });

      order.razorpayOrderId =
        razorpayOrder.id;

      await order.save();

      console.log(
        "Razorpay order created:",
        razorpayOrder.id
      );

      return res.status(200).json({
        message:
          "Razorpay order created",

        razorpayOrder:
          razorpayOrder,

        keyId:
          process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error(
        "Razorpay order creation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create Razorpay order",

        error:
          error.message,
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

      const order =
        await Order.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.status(200).json({
          message:
            "Payment already verified",

          order:
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

      if (
        razorpay_order_id !==
        order.razorpayOrderId
      ) {
        return res.status(400).json({
          message:
            "Invalid Razorpay order ID",
        });
      }

      /* VERIFY SIGNATURE */

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
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

      /* INVENTORY DEDUCTION */

      const deductedItems = [];

      for (
        const item of
          order.items
      ) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id:
                item.productId,

              isActive:
                true,

              stock: {
                $gte:
                  Number(
                    item.quantity
                  ),
              },
            },
            {
              $inc: {
                stock:
                  -Number(
                    item.quantity
                  ),
              },
            },
            {
              new:
                true,
            }
          );

        if (!updatedProduct) {
          for (
            const deducted of
              deductedItems
          ) {
            await Product.findByIdAndUpdate(
              deducted.productId,
              {
                $inc: {
                  stock:
                    Number(
                      deducted.quantity
                    ),
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
          productId:
            item.productId,

          quantity:
            item.quantity,
        });
      }

      order.inventoryDeducted =
        true;

      /* USER */

      const user =
        await User.findById(
          order.userId
        );

      if (!user) {
        for (
          const item of
            deductedItems
        ) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(
                    item.quantity
                  ),
              },
            }
          );
        }

        order.inventoryDeducted =
          false;

        await order.save();

        return res.status(404).json({
          message:
            "User not found",
        });
      }

      /* REWARD POINT VALIDATION */

      if (
        Number(
          order.rewardPointsUsed
        ) >
        Number(
          user.rewardPoints || 0
        )
      ) {
        for (
          const item of
            deductedItems
        ) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(
                    item.quantity
                  ),
              },
            }
          );
        }

        order.inventoryDeducted =
          false;

        await order.save();

        return res.status(400).json({
          message:
            "Insufficient reward points",
        });
      }

      /* DEDUCT REWARD POINTS */

      if (
        Number(
          order.rewardPointsUsed
        ) > 0
      ) {
        user.rewardPoints -=
          Number(
            order.rewardPointsUsed
          );
      }

      /* EARN REWARD POINTS */

      const earnedPoints =
        Math.floor(
          Number(
            order.totalAmount
          ) / 100
        );

      order.rewardPointsEarned =
        earnedPoints;

      user.rewardPoints +=
        earnedPoints;

      await user.save();

      /* COUPON USAGE */

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code:
              order.couponCode,

            $or: [
              {
                usageLimit:
                  null,
              },

              {
                usageLimit: {
                  $exists:
                    false,
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
              usedCount:
                1,
            },
          }
        );
      }

      /* COMPLETE ORDER */

      order.razorpayPaymentId =
        razorpay_payment_id;

      order.paymentStatus =
        "paid";

      order.orderStatus =
        "confirmed";

      await order.save();

      return res.status(200).json({
        message:
          "Payment verified and order confirmed successfully",

        order:
          order,
      });
    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      return res.status(500).json({
        message:
          "Payment verification failed",

        error:
          error.message,
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
      const order =
        await Order.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        ![
          "pending",
          "confirmed",
          "processing",
        ].includes(
          order.orderStatus
        )
      ) {
        return res.status(400).json({
          message:
            "This order cannot be cancelled now",
        });
      }

      /* REFUND */

      if (
        order.paymentStatus ===
          "paid" &&
        order.razorpayPaymentId
      ) {
        try {
          const refund =
            await razorpay
              .payments.refund(
                order.razorpayPaymentId,
                {
                  amount:
                    Math.round(
                      Number(
                        order.totalAmount
                      ) * 100
                    ),

                  speed:
                    "normal",
                }
              );

          console.log(
            "Razorpay refund created:",
            refund.id
          );

          order.refundId =
            refund.id;

          order.refundAmount =
            Number(
              order.totalAmount
            );
        } catch (
          refundError
        ) {
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

      /* RESTORE INVENTORY */

      if (
        order.inventoryDeducted
      ) {
        for (
          const item of
            order.items
        ) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                stock:
                  Number(
                    item.quantity
                  ),
              },
            }
          );
        }

        order.inventoryDeducted =
          false;
      }

      /* RESTORE REWARD POINTS */

      const user =
        await User.findById(
          order.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        Number(
          order.rewardPointsUsed
        ) > 0
      ) {
        user.rewardPoints +=
          Number(
            order.rewardPointsUsed
          );
      }

      if (
        Number(
          order.rewardPointsEarned
        ) > 0
      ) {
        user.rewardPoints =
          Math.max(
            0,
            Number(
              user.rewardPoints
            ) -
              Number(
                order.rewardPointsEarned
              )
          );
      }

      await user.save();

      /* RESTORE COUPON USAGE */

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code:
              order.couponCode,

            usedCount: {
              $gt: 0,
            },
          },
          {
            $inc: {
              usedCount:
                -1,
            },
          }
        );
      }

      /* UPDATE ORDER */

      order.orderStatus =
        "cancelled";

      if (
        order.paymentStatus ===
        "paid"
      ) {
        order.paymentStatus =
          "refunded";
      }

      await order.save();

      return res.status(200).json({
        message:
          order.paymentStatus ===
          "refunded"
            ? "Order cancelled and refund initiated successfully"
            : "Order cancelled successfully",

        order:
          order,
      });
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to cancel order",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   UPDATE DELIVERY DETAILS
   ADMIN
========================================================= */

router.patch(
  "/:id/delivery",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const {
        deliveryMethod,
        shippingProvider,
        trackingId,
        deliveryStatus,
      } = req.body;

      if (!deliveryMethod) {
        return res.status(400).json({
          message:
            "Delivery method is required",
        });
      }

      if (
        ![
          "own_delivery",
          "courier",
        ].includes(
          deliveryMethod
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid delivery method",
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      order.deliveryMethod =
        deliveryMethod;

      if (
        shippingProvider !==
        undefined
      ) {
        order.shippingProvider =
          shippingProvider ||
          null;
      }

      if (
        trackingId !==
        undefined
      ) {
        order.trackingId =
          trackingId ||
          null;
      }

      if (
        deliveryStatus !==
        undefined
      ) {
        const allowedStatuses = [
          "pending",
          "assigned",
          "picked_up",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "cancelled",
        ];

        if (
          !allowedStatuses.includes(
            deliveryStatus
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid delivery status",
          });
        }

        order.deliveryStatus =
          deliveryStatus;

        /*
         * Keep order status synchronized
         * when delivery becomes delivered.
         */

        if (
          deliveryStatus ===
          "delivered"
        ) {
          order.orderStatus =
            "delivered";
        }
      }

      await order.save();

      return res.status(200).json({
        message:
          "Delivery details updated successfully",

        order,
      });
    } catch (error) {
      console.error(
        "Delivery update error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update delivery details",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   RETURN ITEM
========================================================= */

router.post(
  "/:id/items/:itemId/return",
  authMiddleware,
  async (req, res) => {
    try {
      const { reason, comments } = req.body;

      if (!reason) {
        return res.status(400).json({
          message: "Return reason is required",
        });
      }

      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (order.orderStatus !== "delivered") {
        return res.status(400).json({
          message: "Only delivered orders can be returned",
        });
      }

      const item = order.items.id(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          message: "Order item not found",
        });
      }

      if (
        item.returnStatus &&
        item.returnStatus !== "none"
      ) {
        return res.status(400).json({
          message:
            "A return request has already been submitted for this item",
        });
      }

      item.returnStatus = "requested";
      item.returnReason = reason;
      item.returnComments = comments || "";
      item.returnRequestedAt = new Date();

      await order.save();

      return res.status(200).json({
        message: "Return request submitted successfully",
        order,
      });
    } catch (error) {
      console.error("Return request error:", error);

      return res.status(500).json({
        message: "Failed to submit return request",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;