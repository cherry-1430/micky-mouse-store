const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET USER PROFILE
// ==========================================

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE USER PROFILE
// ==========================================

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    await user.save();

    const updatedUser = await User.findById(
      req.user.userId
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});


// ==========================================
// GET SAVED ADDRESSES
// ==========================================

router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "addresses"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user.addresses || []);
  } catch (error) {
    console.error("Get addresses error:", error);

    res.status(500).json({
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
});


// ==========================================
// ADD NEW ADDRESS
// ==========================================

router.post("/addresses", authMiddleware, async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    if (
      !label ||
      !fullName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: "All address fields are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // If this address is default,
    // remove default status from existing addresses
    if (isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    // If this is the first address,
    // automatically make it default
    const makeDefault =
      user.addresses.length === 0
        ? true
        : isDefault === true;

    user.addresses.push({
      label,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: makeDefault,
    });

    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);

    res.status(500).json({
      message: "Failed to add address",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE ADDRESS
// ==========================================

router.patch(
  "/addresses/:addressId",
  authMiddleware,
  async (req, res) => {
    try {
      const { addressId } = req.params;

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const address = user.addresses.id(addressId);

      if (!address) {
        return res.status(404).json({
          message: "Address not found",
        });
      }

      const {
        label,
        fullName,
        phone,
        address: addressText,
        city,
        state,
        pincode,
        isDefault,
      } = req.body;

      // If making this address default,
      // remove default from all other addresses
      if (isDefault === true) {
        user.addresses.forEach((item) => {
          item.isDefault = false;
        });
      }

      if (label !== undefined) {
        address.label = label;
      }

      if (fullName !== undefined) {
        address.fullName = fullName;
      }

      if (phone !== undefined) {
        address.phone = phone;
      }

      if (addressText !== undefined) {
        address.address = addressText;
      }

      if (city !== undefined) {
        address.city = city;
      }

      if (state !== undefined) {
        address.state = state;
      }

      if (pincode !== undefined) {
        address.pincode = pincode;
      }

      if (isDefault !== undefined) {
        address.isDefault = isDefault;
      }

      await user.save();

      res.status(200).json({
        message: "Address updated successfully",
        addresses: user.addresses,
      });
    } catch (error) {
      console.error("Update address error:", error);

      res.status(500).json({
        message: "Failed to update address",
        error: error.message,
      });
    }
  }
);


// ==========================================
// DELETE ADDRESS
// ==========================================

router.delete(
  "/addresses/:addressId",
  authMiddleware,
  async (req, res) => {
    try {
      const { addressId } = req.params;

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const address = user.addresses.id(addressId);

      if (!address) {
        return res.status(404).json({
          message: "Address not found",
        });
      }

      const wasDefault = address.isDefault;

      address.deleteOne();

      // If the deleted address was the default,
      // make the first remaining address default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      res.status(200).json({
        message: "Address deleted successfully",
        addresses: user.addresses,
      });
    } catch (error) {
      console.error("Delete address error:", error);

      res.status(500).json({
        message: "Failed to delete address",
        error: error.message,
      });
    }
  }
);


module.exports = router;