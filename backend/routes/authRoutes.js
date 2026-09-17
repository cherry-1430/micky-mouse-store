const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

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

  // +91XXXXXXXXXX becomes 91XXXXXXXXXX
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = new User({
      name,
      email,
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
      email,
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
SEND OTP USING MSG91
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

    if (!process.env.MSG91_AUTH_KEY) {
      console.error(
        "MSG91_AUTH_KEY is missing"
      );

      return res.status(500).json({
        message:
          "MSG91 is not configured on the server",
      });
    }

    if (!process.env.MSG91_TEMPLATE_ID) {
      console.error(
        "MSG91_TEMPLATE_ID is missing"
      );

      return res.status(500).json({
        message:
          "MSG91 OTP template is not configured",
      });
    }

    const response = await fetch(
      "https://control.msg91.com/api/v5/otp",
      {
        method: "POST",

        headers: {
          authkey:
            process.env.MSG91_AUTH_KEY,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          template_id:
            process.env.MSG91_TEMPLATE_ID,

          mobile: phone,

          otp_length: 6,

          otp_expiry: 10,
        }),
      }
    );

    const data =
      await response.json();

    console.log(
      "MSG91 Send OTP response:",
      data
    );

    if (!response.ok) {
      return res.status(400).json({
        message:
          data.message ||
          "Failed to send OTP",
      });
    }

    res.status(200).json({
      success: true,

      message:
        "OTP sent successfully",

      phone,
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
VERIFY OTP USING MSG91
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

      if (!process.env.MSG91_AUTH_KEY) {
        return res.status(500).json({
          message:
            "MSG91 is not configured",
        });
      }

      /*
      ------------------------------------
      VERIFY OTP WITH MSG91
      ------------------------------------
      */

      const verifyUrl =
        `https://control.msg91.com/api/v5/otp/verify` +
        `?otp=${encodeURIComponent(otp)}` +
        `&mobile=${encodeURIComponent(phone)}`;

      const response = await fetch(
        verifyUrl,
        {
          method: "GET",

          headers: {
            authkey:
              process.env.MSG91_AUTH_KEY,
          },
        }
      );

      const data =
        await response.json();

      console.log(
        "MSG91 Verify OTP response:",
        data
      );

      if (!response.ok) {
        return res.status(400).json({
          message:
            data.message ||
            "OTP verification failed",
        });
      }

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
      IF USER DOES NOT EXIST
      CREATE CUSTOMER
      ------------------------------------
      */

      if (!user) {
        /*
        Use supplied email if available.
        Otherwise generate internal email.
        */

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
          Attach phone to existing account
          if it doesn't already belong to
          another account.
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

          if (name && !user.name) {
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
            OTP is the authentication method.
            Password is only required because
            the User schema requires it.
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

        /*
        Update name/email only when
        useful and safe.
        */

        if (
          name &&
          user.name ===
            "Micky Mouse Customer"
        ) {
          user.name = name;
        }

        /*
        Do not overwrite an existing
        real email with generated email.
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