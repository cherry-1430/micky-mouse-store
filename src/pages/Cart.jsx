import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";

import "./Cart.css";

function Cart() {
  const {
    cart,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const outOfStockItems = cart.filter(
  (item) => Number(item.stock || 0) <= 0
);

  if (cart.length === 0) {
    return (
      <main className="empty-cart">

        <div className="empty-cart-content">

          <span className="empty-cart-label">
            YOUR SHOPPING BAG
          </span>

          <div className="empty-cart-mark">
            🛒
          </div>

          <h1>Your Cart Is Empty</h1>

          <p>
            Looks like you haven't added anything yet.
            Discover something you love from our collection.
          </p>

          <Link
            to="/shop"
            className="continue-shopping"
          >
            CONTINUE SHOPPING →
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="cart-page">

      {/* HEADER */}

      <section className="cart-header">

        <div>
          <p>SPACE WEAR • YOUR SELECTION</p>
          <h1>YOUR CART</h1>
        </div>

        <span className="cart-item-count">
          {cart.length}{" "}
          {cart.length === 1 ? "ITEM" : "ITEMS"}
        </span>

      </section>


      <div className="cart-container">

        {/* CART ITEMS */}

        <section className="cart-items">

          <div className="cart-items-heading">
            <span>PRODUCT</span>
            <span>{cart.length} ITEMS</span>
          </div>


          {cart.map((item) => {
  const isOutOfStock = Number(item.stock || 0) <= 0;

  return (
    <div
      className="cart-item"
      key={`${item.id}-${item.size}`}
    >

      {/* IMAGE */}

      <div className="cart-item-image">

        <img
          src={item.image}
          alt={item.name}
        />

        {isOutOfStock && (
          <div className="cart-out-of-stock">
            OUT OF STOCK
          </div>
        )}

      </div>


      {/* INFORMATION */}

      <div className="cart-item-info">

        <div className="cart-item-top">

          <div>

            <p className="cart-category">
              SPACE WEAR • {item.category || "COLLECTION"}
            </p>

            <h3>
              {item.name}
            </h3>

          </div>

          <button
            className="remove-button"
            onClick={() =>
              removeFromCart(
                item.id,
                item.size
              )
            }
          >
            REMOVE ×
          </button>

        </div>


        {/* OUT OF STOCK WARNING */}

        {isOutOfStock && (
          <p className="cart-stock-warning">
            ⚠ This product is currently out of stock.
          </p>
        )}


        <div className="cart-item-details">

          <div>
            <span>SIZE</span>
            <strong>{item.size}</strong>
          </div>

          <div>
            <span>UNIT PRICE</span>

            <strong>
              ₹{Number(item.price || 0).toLocaleString("en-IN")}
            </strong>
          </div>

        </div>


        <div className="cart-actions">

          <div className="quantity-control">

            <button
              onClick={() =>
                updateQuantity(
                  item.id,
                  item.size,
                  item.quantity - 1
                )
              }
              disabled={
                isOutOfStock ||
                item.quantity <= 1
              }
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>
              {item.quantity}
            </span>

            <button
              onClick={() =>
                updateQuantity(
                  item.id,
                  item.size,
                  item.quantity + 1
                )
              }
              disabled={isOutOfStock}
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>


          <strong className="cart-item-total">
            ₹
            {(
              Number(item.price || 0) *
              Number(item.quantity || 0)
            ).toLocaleString("en-IN")}
          </strong>

        </div>

      </div>

    </div>
  );
})}

        </section>


        {/* SUMMARY */}

        <aside className="cart-summary">

          <p className="summary-label">
            YOUR ORDER
          </p>

          <h2>
            ORDER SUMMARY
          </h2>


          <div className="summary-row">

            <span>Subtotal</span>

            <span>
              ₹{cartTotal.toLocaleString("en-IN")}
            </span>

          </div>




          <div className="summary-note">
             shipping charges will be applicable based on Cart Value.
          </div>


          <div className="summary-divider"></div>


          <div className="summary-total">

            <span>TOTAL</span>

            <strong>
              ₹{cartTotal.toLocaleString("en-IN")}
            </strong>

          </div>


       {cart.some(
  (item) => Number(item.stock || 0) <= 0
) ? (
  <button
    type="button"
    className="checkout-button checkout-disabled"
    onClick={() => {
      outOfStockItems.forEach((item) => {
        removeFromCart(item.id, item.size);
      });
    }}
  >
    REMOVE{" "}
    {outOfStockItems.length > 1
      ? "OUT OF STOCK ITEMS"
      : "OUT OF STOCK ITEM"}
  </button>
) : (
  <Link
    to="/checkout"
    className="checkout-button"
  >
    PROCEED TO CHECKOUT
    <span>→</span>
  </Link>
)}


          <Link
            to="/shop"
            className="continue-shopping"
          >
            ← CONTINUE SHOPPING
          </Link>


          <div className="cart-trust">

            <span>🔒 SECURE CHECKOUT</span>
            <span>✓ EASY RETURNS</span>

          </div>

        </aside>

      </div>

    </main>
  );
}

export default Cart;