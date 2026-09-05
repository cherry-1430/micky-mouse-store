const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const products = [
  {
    name: "Micky Mouse Premium Black Hoodie",
    category: "Hoodies",
    gender: "Men",
    price: 1499,
    originalPrice: 1999,
    description:
      "Premium cotton black hoodie designed for comfort, style and everyday wear.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black"],
    stock: 50,
    rating: 4.5,
    reviewCount: 128,
    isFeatured: true,
    isActive: true,
  },

  {
    name: "Micky Mouse Classic White Shirt",
    category: "Shirts",
    gender: "Men",
    price: 1199,
    originalPrice: 1499,
    description:
      "Premium casual white shirt with a clean and modern fit.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White"],
    stock: 40,
    rating: 4.4,
    reviewCount: 86,
    isFeatured: true,
    isActive: true,
  },

  {
    name: "Micky Mouse Premium Black Shirt",
    category: "Shirts",
    gender: "Men",
    price: 1299,
    originalPrice: 1599,
    description:
      "Stylish premium black shirt suitable for casual and semi-formal occasions.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black"],
    stock: 35,
    rating: 4.6,
    reviewCount: 104,
    isFeatured: false,
    isActive: true,
  },

  {
    name: "Micky Mouse Relaxed Fit Cargo Pants",
    category: "Pants",
    gender: "Men",
    price: 1399,
    originalPrice: 1799,
    description:
      "Relaxed fit cargo pants designed for everyday comfort and streetwear style.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["30", "32", "34", "36", "38"],
    colors: ["Black", "Olive"],
    stock: 45,
    rating: 4.3,
    reviewCount: 72,
    isFeatured: true,
    isActive: true,
  },

  {
    name: "Micky Mouse Premium Grey T-Shirt",
    category: "T-Shirts",
    gender: "Men",
    price: 699,
    originalPrice: 899,
    description:
      "Soft premium cotton grey T-shirt with a comfortable regular fit.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Grey"],
    stock: 60,
    rating: 4.5,
    reviewCount: 156,
    isFeatured: true,
    isActive: true,
  },

  {
    name: "Micky Mouse Oversized Black T-Shirt",
    category: "T-Shirts",
    gender: "Men",
    price: 799,
    originalPrice: 999,
    description:
      "Premium oversized black T-shirt designed for modern streetwear looks.",
    image: "https://placehold.co/600x800",
    images: [
      "https://placehold.co/600x800",
      "https://placehold.co/600x800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White"],
    stock: 55,
    rating: 4.7,
    reviewCount: 193,
    isFeatured: false,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Product.deleteMany();

    await Product.insertMany(products);

    console.log(`${products.length} products added successfully`);

    await mongoose.connection.close();

    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seedProducts();