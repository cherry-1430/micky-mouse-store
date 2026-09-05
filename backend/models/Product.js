const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      default: "Men",
    },

    price: {
      type: Number,
      required: true,
    },

    originalPrice: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [String],
      required: true,
    },

    colors: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);