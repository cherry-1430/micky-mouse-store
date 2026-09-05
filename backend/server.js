const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed");
    console.error(error);
  });

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Micky Mouse API is running!",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(
    `Micky Mouse backend running on port ${PORT}`
  );
});