const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER
    // =====================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // CUSTOMER
    // =====================================================

    customer: {
      firstName: {
        type: String,
        required: true,
      },

      lastName: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },
    },

    // =====================================================
    // SHIPPING ADDRESS
    // =====================================================

    shippingAddress: {
      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      pincode: {
        type: String,
        required: true,
      },
    },

    // =====================================================
    // ORDER ITEMS
    // =====================================================

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        image: {
          type: String,
        },

        size: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },
        returnStatus: {
  type: String,
  enum: [
    "none",
    "requested",
    "approved",
    "rejected",
    "picked_up",
    "completed",
  ],
  default: "none",
},

returnReason: {
  type: String,
  default: null,
},

returnComments: {
  type: String,
  default: "",
},

returnRequestedAt: {
  type: Date,
  default: null,
},

returnProcessedAt: {
  type: Date,
  default: null,
},
      },
    ],

    // =====================================================
    // PRICE DETAILS
    // =====================================================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryMethod: {
      type: String,
      enum: ["own_delivery", "courier"],
      default: "own_delivery",
    },

    shippingProvider: {
      type: String,
      default: null,
    },

    trackingId: {
      type: String,
      default: null,
    },

    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    couponCode: {
      type: String,
      default: null,
      trim: true,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardPointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // PAYMENT
    // =====================================================

    paymentMethod: {
      type: String,
      default: "online",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "refunded",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // =====================================================
    // REFUND
    // =====================================================

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundId: {
      type: String,
      default: null,
    },

    // =====================================================
    // INVENTORY
    // =====================================================

    inventoryDeducted: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // ORDER STATUS
    // =====================================================

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // =====================================================
    // RETURN
    // =====================================================

    returnStatus: {
      type: String,
      enum: [
        "not_requested",
        "requested",
        "approved",
        "rejected",
        "picked_up",
        "received",
        "refunded",
      ],
      default: "not_requested",
    },

    returnReason: {
      type: String,
      default: null,
    },

    returnRequestedAt: {
      type: Date,
      default: null,
    },

    returnProcessedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// =========================================================
// INDEX
// =========================================================

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

// =========================================================
// MODEL
// =========================================================

module.exports = mongoose.model(
  "Order",
  orderSchema
);