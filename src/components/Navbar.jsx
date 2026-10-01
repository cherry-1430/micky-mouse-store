import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";
import spacewearLogo from "../assets/spacewear-logo.png";

import "./Navbar.css"

function Navbar() {
  const navigate = useNavigate();

  const { user, isLoggedIn, logout } = useAuth();
  const { cartCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(null);

  const handleSearch = (event) => {
    event.preventDefault();

    const searchValue = search.trim();

    if (!searchValue) {
      navigate("/shop");
      setSearchOpen(false);
      return;
    }

    navigate(`/shop?search=${encodeURIComponent(searchValue)}`);

    setSearch("");
    setSearchOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const animateToCart = (product) => {
    const cartElement = document.getElementById("navbar-cart");

    if (!cartElement) return;

    const cartRect = cartElement.getBoundingClientRect();

    setCartAnimation({
      image: product.image,
      startX: window.innerWidth / 2 - 40,
      startY: window.innerHeight / 2 - 40,
      endX: cartRect.left + cartRect.width / 2 - 40,
      endY: cartRect.top + cartRect.height / 2 - 40,
    });

    setTimeout(() => {
      setCartAnimation(null);
    }, 800);
  };

  return (
    <nav className="navbar">

      {/* LOGO */}

    <Link to="/" className="navbar-logo">
  <img src={spacewearLogo} alt="SPACE WEAR" />
</Link>


      {/* DESKTOP NAVIGATION */}

      <div className="nav-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/shop">
          Shop
        </Link>

        <Link to="/shop?category=hoodies">
          Hoodies
        </Link>

        <Link to="/shop?category=shirts">
          Shirts
        </Link>

        <Link to="/shop?category=pants">
          Pants
        </Link>

        <Link to="/shop?category=new">
          New Arrivals
        </Link>

      </div>


      {/* RIGHT SIDE */}

      <div className="nav-actions">

        {/* SEARCH */}

        <div className="navbar-search">

          <button
            className="nav-icon-button"
            aria-label="Search"
            title="Search"
            onClick={() =>
              setSearchOpen(
                (previous) => !previous
              )
            }
          >
            🔍
          </button>

          {searchOpen && (
            <form
              className="navbar-search-form"
              onSubmit={handleSearch}
            >
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                autoFocus
              />

              <button type="submit">
                →
              </button>
            </form>
          )}

        </div>


        {/* DESKTOP USER */}

        {isLoggedIn && user && (
          <>

            <span className="nav-user">
              Hi, {user.name}
            </span>

            <Link
              to="/profile"
              className="nav-profile-link"
              title="My Profile"
            >
              👤
            </Link>

            <Link
              to="/my-orders"
              className="nav-icon-button"
              aria-label="My Orders"
              title="My Orders"
            >
              📦
            </Link>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="admin-link"
              >
                Admin
              </Link>
            )}

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </>
        )}


        {/* WISHLIST */}

        <Link
          to="/wishlist"
          className="nav-icon-button"
          aria-label="Wishlist"
          title="Wishlist"
        >
          ♡
        </Link>


        {/* CART */}

        <Link
          to="/cart"
          className="navbar-cart"
          id="navbar-cart"
          aria-label="Shopping Cart"
          title="Shopping Cart"
        >
          🛒

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}
        </Link>


        {/* MOBILE MENU BUTTON */}

        <button
          className="mobile-menu-button"
          aria-label="Open menu"
          onClick={() =>
            setMobileMenuOpen(
              (previous) => !previous
            )
          }
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

      </div>


      {/* MOBILE MENU */}

      <div
        className={`mobile-menu ${
          mobileMenuOpen ? "mobile-menu-open" : ""
        }`}
      >

        <Link
          to="/"
          onClick={closeMobileMenu}
        >
          Home
        </Link>

        <Link
          to="/shop"
          onClick={closeMobileMenu}
        >
          Shop
        </Link>

        <Link
          to="/shop?category=hoodies"
          onClick={closeMobileMenu}
        >
          Hoodies
        </Link>

        <Link
          to="/shop?category=shirts"
          onClick={closeMobileMenu}
        >
          Shirts
        </Link>

        <Link
          to="/shop?category=pants"
          onClick={closeMobileMenu}
        >
          Pants
        </Link>

        <Link
          to="/shop?category=new"
          onClick={closeMobileMenu}
        >
          New Arrivals
        </Link>


        {isLoggedIn && user && (
          <>

            <div className="mobile-user">
              Hi, {user.name}
            </div>

            <Link
              to="/profile"
              onClick={closeMobileMenu}
            >
              👤 My Profile
            </Link>

            <Link
              to="/my-orders"
              onClick={closeMobileMenu}
            >
              📦 My Orders
            </Link>

            {user.role === "admin" && (
              <Link
                to="/admin"
                onClick={closeMobileMenu}
              >
                Admin Dashboard
              </Link>
            )}

            <button
              className="mobile-logout"
              onClick={handleLogout}
            >
              Logout
            </button>

          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;