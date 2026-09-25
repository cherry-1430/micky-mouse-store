const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const AdminPushSubscription = require("../models/AdminPushSubscription");

const router = express.Router();

/*
  Register a browser/device as an ADMIN push recipient.
*/
router.post(
  "/subscribe",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Admin access required",
        });
      }

      const { subscription } = req.body;

      if (
        !subscription ||
        !subscription.endpoint ||
        !subscription.keys?.p256dh ||
        !subscription.keys?.auth
      ) {
        return res.status(400).json({
          message: "Invalid push subscription",
        });
      }

      await AdminPushSubscription.findOneAndUpdate(
        {
          endpoint: subscription.endpoint,
        },
        {
          userId: req.user.userId,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        message:
          "Admin device registered for push notifications",
      });
    } catch (error) {
      console.error(
        "Admin push subscribe error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to register admin push notifications",
      });
    }
  }
);

/*
  Remove this browser/device subscription.
*/
router.delete(
  "/subscribe",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Admin access required",
        });
      }

      const { endpoint } = req.body;

      if (endpoint) {
        await AdminPushSubscription.deleteOne({
          endpoint,
          userId: req.user.userId,
        });
      }

      return res.status(200).json({
        message:
          "Admin device push subscription removed",
      });
    } catch (error) {
      console.error(
        "Admin push unsubscribe error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to remove admin push subscription",
      });
    }
  }
);

module.exports = router;
