import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import MyOrders from "./pages/MyOrders";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import { CartProvider } from "./context/CartContext";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderDetails from "./pages/OrderDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";


function App() {
  return (
     <AuthProvider>
    <CartProvider>
        <WishlistProvider>
    <BrowserRouter>

      <Navbar />

      <Routes>

       <Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>

        <Route path="/shop" element={<Shop />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/product/:id" element={<ProductDetails />}
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
<Route
  path="/my-orders"
  element={
    <ProtectedRoute>
      <MyOrders />
    </ProtectedRoute>
  }
/>
        <Route
  path="/wishlist"
  element={<Wishlist />}
/>
<Route
  path="/checkout"
  element={
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  }
/>
<Route
  path="/order-success"
  element={<OrderSuccess />}
/>
<Route
  path="/orders/:id"
   element={
    <ProtectedRoute>
      <OrderDetails />
    </ProtectedRoute>}
/>
<Route
  path="/admin"
  element={
    <ProtectedRoute adminOnly={true}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
      </Routes>

      <Footer />

    </BrowserRouter>
    </WishlistProvider>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;