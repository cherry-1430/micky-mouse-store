const express = require("express");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET REVIEWS FOR A PRODUCT
// GET /api/reviews/product/:productId
// =====================================================

router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((review) => ({
      ...review.toObject(),
      user: review.userId,
      userId: undefined,
    }));

    res.status(200).json(formattedReviews);

  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});


// =====================================================
// CREATE REVIEW
// POST /api/reviews
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      productId,
      rating,
      comment,
    } = req.body;

    // Validate required fields
    if (!productId || !rating || !comment?.trim()) {
      return res.status(400).json({
        message: "Product, rating and comment are required",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }


    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }


    // Check whether user already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId: req.user.userId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }


    // Check whether user purchased the product
    const orders = await Order.find({
      userId: req.user.userId,
    });

    let isVerifiedPurchase = false;

    for (const order of orders) {

      if (
        order.paymentStatus === "paid" &&
        order.orderStatus !== "cancelled"
      ) {

        const purchasedProduct = order.items.some(
          (item) =>
            item.productId.toString() ===
            productId.toString()
        );

        if (purchasedProduct) {
          isVerifiedPurchase = true;
          break;
        }
      }
    }


    // Create review
    const review = new Review({
      productId,
      userId: req.user.userId,
      rating: Number(rating),
      comment: comment.trim(),
      isVerifiedPurchase,
    });

    const savedReview = await review.save();


    // Recalculate product rating
    const allReviews = await Review.find({
      productId,
    });

    const totalRating = allReviews.reduce(
      (total, item) => total + item.rating,
      0
    );

    const averageRating =
      totalRating / allReviews.length;


    // Update product
    product.rating = Number(
      averageRating.toFixed(1)
    );

    product.reviewCount = allReviews.length;

    await product.save();


    // Return populated review
    const populatedReview = await Review.findById(
      savedReview._id
    ).populate("userId", "name");


    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });

  } catch (error) {

    console.error("Create review error:", error);

    res.status(500).json({
      message: "Failed to create review",
      error: error.message,
    });
  }
});


module.exports = router;