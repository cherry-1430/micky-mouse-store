const express = require("express");
const Product = require("../models/Product");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// POST new product
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

// DELETE product
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Find the product first
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      // Delete the image from Cloudinary
      if (product.image) {
        const imageUrl = product.image;

        const uploadMarker = "/upload/";
        const uploadIndex = imageUrl.indexOf(uploadMarker);

        if (uploadIndex !== -1) {
          let publicId = imageUrl.substring(
            uploadIndex + uploadMarker.length
          );

          // Remove version part, for example: v1788709181/
          publicId = publicId.replace(/^v\d+\//, "");

          // Remove file extension
          publicId = publicId.replace(/\.[^/.]+$/, "");

          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Delete the product from MongoDB
      await Product.findByIdAndDelete(req.params.id);

      res.json({
        message: "Product and image deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);

      res.status(500).json({
        message: "Failed to delete product",
        error: error.message,
      });
    }
  }
);


module.exports = router;