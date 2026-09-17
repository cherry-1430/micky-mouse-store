const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},
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
      },
    ],

    subtotal: {
  type: Number,
  required: true,
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
},

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
    inventoryDeducted: {
  type: Boolean,
  default: false,
},

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
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Order", orderSchema);