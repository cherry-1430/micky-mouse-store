const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

/*
========================================
DEVELOPMENT OTP STORAGE
========================================

OTP is stored temporarily in server memory.

IMPORTANT:
This is for development/testing only.
For production, use MSG91 or another
proper OTP provider.
*/

const otpStore = new Map();

/*
========================================
HELPER: NORMALIZE INDIAN PHONE NUMBER
========================================
*/

const normalizePhone = (phone) => {
  if (!phone) return null;

  let cleaned = String(phone).replace(/\D/g, "");

  // 10 digit Indian number
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  // 12 digit Indian number starting with 91
  if (
    cleaned.length === 12 &&
    cleaned.startsWith("91")
  ) {
    return cleaned;
  }

  return null;
};

/*
========================================
HELPER: CREATE JWT
========================================
*/

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/*
========================================
REGISTER
========================================
*/

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await user.save();

    res.status(201).json({
      message:
        "User registered successfully",

      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

/*
========================================
LOGIN
========================================
*/

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token = createToken(user);

    res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

/*
========================================
SEND DEVELOPMENT OTP
========================================

No MSG91 required.

For testing:
OTP = 123456

========================================
*/

router.post("/send-otp", async (req, res) => {
  try {
    const phone = normalizePhone(
      req.body.phone
    );

    if (!phone) {
      return res.status(400).json({
        message:
          "Enter a valid Indian mobile number",
      });
    }

    /*
    ------------------------------------
    DEVELOPMENT OTP
    ------------------------------------
    */

    const otp = "123456";

    /*
    OTP expires after 10 minutes.
    */

    const expiresAt =
      Date.now() + 10 * 60 * 1000;

    otpStore.set(phone, {
      otp,
      expiresAt,
    });

    /*
    ------------------------------------
    SERVER LOG
    ------------------------------------
    */

    console.log(
      "================================="
    );

    console.log(
      "DEVELOPMENT OTP GENERATED"
    );

    console.log(
      `Phone: ${phone}`
    );

    console.log(
      `OTP: ${otp}`
    );

    console.log(
      "Expires in: 10 minutes"
    );

    console.log(
      "================================="
    );

    /*
    ------------------------------------
    RESPONSE
    ------------------------------------
    */

    res.status(200).json({
      success: true,

      message:
        "OTP sent successfully",

      phone,

      /*
      Development only.
      This allows you to see the OTP
      in the browser response too.
      Remove this before production.
      */

      developmentOtp: otp,
    });
  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to send OTP",

      error: error.message,
    });
  }
});

/*
========================================
VERIFY DEVELOPMENT OTP
========================================
*/

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const {
        otp,
        name,
        email,
      } = req.body;

      const phone = normalizePhone(
        req.body.phone
      );

      /*
      ------------------------------------
      VALIDATION
      ------------------------------------
      */

      if (!phone || !otp) {
        return res.status(400).json({
          message:
            "Phone number and OTP are required",
        });
      }

      /*
      ------------------------------------
      GET STORED OTP
      ------------------------------------
      */

      const storedOtp =
        otpStore.get(phone);

      if (!storedOtp) {
        return res.status(400).json({
          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      /*
      ------------------------------------
      CHECK EXPIRY
      ------------------------------------
      */

      if (
        Date.now() >
        storedOtp.expiresAt
      ) {
        otpStore.delete(phone);

        return res.status(400).json({
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      /*
      ------------------------------------
      CHECK OTP
      ------------------------------------
      */

      if (
        String(otp).trim() !==
        storedOtp.otp
      ) {
        return res.status(400).json({
          message:
            "Invalid OTP. Please try again.",
        });
      }

      /*
      ------------------------------------
      OTP VERIFIED
      ------------------------------------
      */

      console.log(
        `OTP verified successfully for ${phone}`
      );

      /*
      Delete OTP after successful
      verification so it cannot be reused.
      */

      otpStore.delete(phone);

      /*
      ------------------------------------
      FIND USER BY PHONE
      ------------------------------------
      */

      let user = await User.findOne({
        phone,
      });

      /*
      ------------------------------------
      CREATE USER IF NOT EXISTS
      ------------------------------------
      */

      if (!user) {
        let customerEmail =
          email
            ? String(email)
                .trim()
                .toLowerCase()
            : `${phone}@mickymouse.local`;

        /*
        Check whether email already exists.
        */

        const existingEmailUser =
          await User.findOne({
            email: customerEmail,
          });

        if (existingEmailUser) {
          /*
          Email belongs to another phone.
          */

          if (
            existingEmailUser.phone &&
            existingEmailUser.phone !== phone
          ) {
            return res.status(400).json({
              message:
                "This email is already associated with another mobile number.",
            });
          }

          user = existingEmailUser;

          user.phone = phone;

          if (
            name &&
            user.name ===
              "Micky Mouse Customer"
          ) {
            user.name = name;
          }

          await user.save();
        } else {
          /*
          Create new customer.
          */

          user = new User({
            name:
              name ||
              "Micky Mouse Customer",

            email:
              customerEmail,

            phone,

            /*
            Password is required by
            the existing User schema.
            */

            password:
              await bcrypt.hash(
                `${phone}-${Date.now()}-${Math.random()}`,
                10
              ),

            role: "user",

            rewardPoints: 0,
          });

          await user.save();
        }
      } else {
        /*
        ------------------------------------
        EXISTING USER
        ------------------------------------
        */

        if (
          name &&
          user.name ===
            "Micky Mouse Customer"
        ) {
          user.name = name;
        }

        /*
        Update generated email if the
        customer provides a real email.
        */

        if (
          email &&
          user.email.endsWith(
            "@mickymouse.local"
          )
        ) {
          const normalizedEmail =
            String(email)
              .trim()
              .toLowerCase();

          const emailOwner =
            await User.findOne({
              email: normalizedEmail,

              _id: {
                $ne: user._id,
              },
            });

          if (!emailOwner) {
            user.email =
              normalizedEmail;
          }
        }

        await user.save();
      }

      /*
      ------------------------------------
      CREATE JWT
      ------------------------------------
      */

      const token =
        createToken(user);

      /*
      ------------------------------------
      RESPONSE
      ------------------------------------
      */

      res.status(200).json({
        success: true,

        message:
          "OTP verified successfully",

        token,

        user: {
          id: user._id,

          name: user.name,

          email: user.email,

          phone: user.phone,

          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      res.status(500).json({
        message:
          "OTP verification failed",

        error: error.message,
      });
    }
  }
);

module.exports = router;