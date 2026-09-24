import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();

  const { user, isLoggedIn, logout } = useAuth();
  const { cartCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartAnimation, setCartAnimation] = useState(null);

  const handleSearch = (event) => {
    event.preventDefault();

    const searchValue = search.trim();

    if (!searchValue) {
      navigate("/shop");
      setSearchOpen(false);
      return;
    }

    navigate(
      `/shop?search=${encodeURIComponent(searchValue)}`
    );

    setSearch("");
    setSearchOpen(false);
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

      <Link to="/" className="logo">
        <span className="logo-main">
          Space
        </span>

        <span className="logo-sub">
          Wear
        </span>
      </Link>


      {/* NAVIGATION */}

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
                  setSearch(
                    event.target.value
                  )
                }
                autoFocus
              />

              <button type="submit">
                →
              </button>

            </form>
          )}

        </div>


        {/* USER */}

        {isLoggedIn && user ? (
          <>

            <span className="nav-user">
              Hi, {user.name}
            </span>


            {/* PROFILE */}

            <Link
              to="/profile"
              className="nav-profile-link"
              title="My Profile"
            >
              👤
            </Link>


            {/* MY ORDERS */}

            <Link
              to="/my-orders"
              className="nav-icon-button"
              aria-label="My Orders"
              title="My Orders"
            >
              📦
            </Link>


            {/* ADMIN */}

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="admin-link"
              >
                Admin
              </Link>
            )}


            {/* LOGOUT */}

            <button
              className="logout-button"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>

          </>
        ) : null}


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

      </div>

    </nav>
  );
}

export default Navbar;