import { BrowserRouter, Routes, Route } from "react-router-dom";

import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import CustomerSupport from "./components/CustomerSupport";


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>

          <BrowserRouter>

            <Navbar />

            <Routes>

              {/* =========================================
                  HOME
              ========================================== */}

              <Route
                path="/"
                element={<Home />}
              />


              {/* =========================================
                  SHOP
              ========================================== */}

              <Route
                path="/shop"
                element={<Shop />}
              />


              {/* =========================================
                  PRODUCT DETAILS
              ========================================== */}

              <Route
                path="/product/:id"
                element={<ProductDetails />}
              />


              {/* =========================================
                  CART
              ========================================== */}

              <Route
                path="/cart"
                element={<Cart />}
              />
              <Route path="/login" element={<Login />} />

              <Route path="/register" element={<Register />}/>

              {/* =========================================
                  WISHLIST
              ========================================== */}

              <Route
                path="/wishlist"
                element={<Wishlist />}
              />


              {/* =========================================
                  CHECKOUT
                  
                  NO LOGIN REQUIRED.
                  MSG91 OTP WILL BE USED INSIDE CHECKOUT.
              ========================================== */}

              <Route
  path="/checkout"
  element={
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  }
/>

              {/* =========================================
                  ORDER SUCCESS
              ========================================== */}

              <Route
                path="/order-success"
                element={<OrderSuccess />}
              />


              {/* =========================================
                  PROFILE
                  
                  KEEP PROTECTED FOR NOW.
              ========================================== */}

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />


              {/* =========================================
                  MY ORDERS
              ========================================== */}

              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />


              {/* =========================================
                  ORDER DETAILS
              ========================================== */}

              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />


              {/* =========================================
                  ADMIN
              ========================================== */}

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

            </Routes>

            <CustomerSupport />

            <Footer />

          </BrowserRouter>

        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;