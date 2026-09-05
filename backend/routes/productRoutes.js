const express = require("express");
const Product = require("../models/Product");

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
router.post("/", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// ADD new product

router.post("/", async (req, res) => {

  try {

    const product = new Product({
      name: req.body.name,
      category: req.body.category,
      gender: req.body.gender,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image,
      sizes: req.body.sizes,
      stock: req.body.stock,
      rating: req.body.rating,
      isFeatured: req.body.isFeatured,
    });

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);

  } catch (error) {

    res.status(500).json({
      message: "Failed to add product",
      error: error.message,
    });

  }

});

module.exports = router;