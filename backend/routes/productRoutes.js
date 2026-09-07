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

// GET recommended products
router.get("/recommendations/:id", async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);

    if (!currentProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Find products with the same category or gender
    let recommendations = await Product.find({
      _id: { $ne: currentProduct._id },
      isActive: { $ne: false },
      $or: [
        { category: currentProduct.category },
        { gender: currentProduct.gender },
      ],
    })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(8);

    // If fewer than 4 products were found,
    // fill the remaining slots with other products
    if (recommendations.length < 4) {
      const recommendedIds = [
        currentProduct._id,
        ...recommendations.map((product) => product._id),
      ];

      const fallbackProducts = await Product.find({
        _id: { $nin: recommendedIds },
        isActive: { $ne: false },
      })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(8 - recommendations.length);

      recommendations = [...recommendations, ...fallbackProducts];
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
});

// GET active flash sale products
router.get("/flash-sales", async (req, res) => {
  try {
    const now = new Date();

    const products = await Product.find({
      isActive: true,
      isFlashSale: true,
      salePrice: { $gt: 0 },
      saleStart: { $lte: now },
      saleEnd: { $gt: now },
    }).sort({ saleEnd: 1 });

    const formattedProducts = products.map((product) => {
      const discount =
        product.originalPrice > product.salePrice
          ? Math.round(
              ((product.originalPrice - product.salePrice) /
                product.originalPrice) *
                100
            )
          : 0;

      return {
        ...product.toObject(),
        discount,
        saleRemaining: Math.max(
          0,
          new Date(product.saleEnd).getTime() - now.getTime()
        ),
      };
    });

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error("Flash sale error:", error);

    res.status(500).json({
      message: "Failed to fetch flash sale products",
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

// UPDATE product
router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedProduct) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);

      res.status(400).json({
        message: "Failed to update product",
        error: error.message,
      });
    }
  }
);

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