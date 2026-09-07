const express = require("express");
const Coupon = require("../models/Coupon");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


// =====================================================
// ADMIN — GET ALL COUPONS
// =====================================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const coupons = await Coupon.find()
        .sort({ createdAt: -1 });

      res.status(200).json(coupons);
    } catch (error) {
      console.error("Get coupons error:", error);

      res.status(500).json({
        message: "Failed to fetch coupons",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN — CREATE COUPON
// =====================================================

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscount,
        usageLimit,
        expiryDate,
        isActive,
      } = req.body;

      if (
        !code ||
        !discountType ||
        discountValue === undefined ||
        !expiryDate
      ) {
        return res.status(400).json({
          message:
            "Code, discount type, discount value and expiry date are required",
        });
      }

      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({
          message: "Invalid discount type",
        });
      }

      if (Number(discountValue) <= 0) {
        return res.status(400).json({
          message: "Discount value must be greater than 0",
        });
      }

      if (
        discountType === "percentage" &&
        Number(discountValue) > 100
      ) {
        return res.status(400).json({
          message: "Percentage discount cannot exceed 100%",
        });
      }

      const existingCoupon = await Coupon.findOne({
        code: code.toUpperCase().trim(),
      });

      if (existingCoupon) {
        return res.status(400).json({
          message: "Coupon code already exists",
        });
      }

      const coupon = new Coupon({
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minimumOrderAmount: Number(minimumOrderAmount) || 0,
        maximumDiscount:
          maximumDiscount === "" ||
          maximumDiscount === undefined
            ? null
            : Number(maximumDiscount),
        usageLimit:
          usageLimit === "" ||
          usageLimit === undefined
            ? null
            : Number(usageLimit),
        expiryDate: new Date(expiryDate),
        isActive:
          isActive === undefined ? true : Boolean(isActive),
      });

      const savedCoupon = await coupon.save();

      res.status(201).json({
        message: "Coupon created successfully",
        coupon: savedCoupon,
      });
    } catch (error) {
      console.error("Create coupon error:", error);

      res.status(500).json({
        message: "Failed to create coupon",
        error: error.message,
      });
    }
  }
);


// =====================================================
// CUSTOMER — VALIDATE COUPON
// =====================================================

router.post(
  "/validate",
  authMiddleware,
  async (req, res) => {
    try {
      const { code, orderAmount } = req.body;

      if (!code) {
        return res.status(400).json({
          message: "Coupon code is required",
        });
      }

      const amount = Number(orderAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Invalid order amount",
        });
      }

      const coupon = await Coupon.findOne({
        code: code.toUpperCase().trim(),
      });

      if (!coupon) {
        return res.status(404).json({
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          message: "This coupon is inactive",
        });
      }

      const now = new Date();

      if (new Date(coupon.expiryDate) <= now) {
        return res.status(400).json({
          message: "This coupon has expired",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message: "This coupon has reached its usage limit",
        });
      }

      if (amount < coupon.minimumOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
        });
      }

      let discount = 0;

      if (coupon.discountType === "percentage") {
        discount =
          (amount * coupon.discountValue) / 100;

        if (
          coupon.maximumDiscount !== null &&
          discount > coupon.maximumDiscount
        ) {
          discount = coupon.maximumDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }

      // Never allow the discount to exceed the order value.
      discount = Math.min(discount, amount);

      discount = Number(discount.toFixed(2));

      const finalAmount = Number(
        (amount - discount).toFixed(2)
      );

      res.status(200).json({
        message: "Coupon applied successfully",

        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },

        discount,
        finalAmount,
      });
    } catch (error) {
      console.error("Validate coupon error:", error);

      res.status(500).json({
        message: "Failed to validate coupon",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN — TOGGLE COUPON
// =====================================================

router.patch(
  "/:id/toggle",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(
        req.params.id
      );

      if (!coupon) {
        return res.status(404).json({
          message: "Coupon not found",
        });
      }

      coupon.isActive = !coupon.isActive;

      await coupon.save();

      res.status(200).json({
        message: coupon.isActive
          ? "Coupon activated"
          : "Coupon deactivated",

        coupon,
      });
    } catch (error) {
      console.error("Toggle coupon error:", error);

      res.status(500).json({
        message: "Failed to update coupon",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN — DELETE COUPON
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const coupon = await Coupon.findByIdAndDelete(
        req.params.id
      );

      if (!coupon) {
        return res.status(404).json({
          message: "Coupon not found",
        });
      }

      res.status(200).json({
        message: "Coupon deleted successfully",
      });
    } catch (error) {
      console.error("Delete coupon error:", error);

      res.status(500).json({
        message: "Failed to delete coupon",
        error: error.message,
      });
    }
  }
);


module.exports = router;