import { Link } from "react-router-dom";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

import "./Wishlist.css";

function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const getProductId = (product) =>
    product?._id || product?.id;

  const moveToCart = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      alert("Product information is missing.");
      return;
    }

    const stock = Number(product.stock) || 0;

    if (stock <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    if (!product.sizes || product.sizes.length === 0) {
      alert("Size information is not available.");
      return;
    }

    const defaultSize = product.sizes[0];

    addToCart(product, defaultSize, 1);

    toggleWishlist(product);

    alert(`${product.name} moved to cart`);
  };

  /* =================================
     EMPTY WISHLIST
  ================================= */

  if (wishlist.length === 0) {
    return (
      <main className="empty-wishlist">

        <div className="empty-wishlist-content">

          <div className="empty-wishlist-icon">
            ♡
          </div>

          <p className="empty-wishlist-label">
            SPACE WEAR • SAVED ITEMS
          </p>

          <h1>
            NOTHING
            <br />
            SAVED.
          </h1>

          <p>
            Save your favourite products here and
            come back to them whenever you're ready.
          </p>

          <Link
            to="/shop"
            className="wishlist-shop-button"
          >
            EXPLORE COLLECTION →
          </Link>

        </div>

      </main>
    );
  }

  /* =================================
     WISHLIST PAGE
  ================================= */

  return (
    <main className="wishlist-page">

      {/* =================================
          HEADER
      ================================= */}

      <section className="wishlist-header">

        <div className="wishlist-header-content">

          <p>
            SPACE WEAR • SAVED COLLECTION
          </p>

          <h1>
            MY
            <br />
            WISHLIST.
          </h1>

          <span>
            Keep track of the pieces you love and
            move them to your cart whenever you're ready.
          </span>

        </div>

        <div className="wishlist-header-mark">
          <span>♡</span>
        </div>

      </section>


      {/* =================================
          CONTENT
      ================================= */}

      <section className="wishlist-content">

        {/* TOP BAR */}

        <div className="wishlist-topbar">

          <div>

            <span>SAVED ITEMS</span>

            <h2>
              {wishlist.length}{" "}
              {wishlist.length === 1
                ? "PRODUCT"
                : "PRODUCTS"}
            </h2>

          </div>

          <Link
            to="/shop"
            className="wishlist-shop-link"
          >
            CONTINUE SHOPPING →
          </Link>

        </div>


        {/* =================================
            PRODUCTS
        ================================= */}

        <div className="wishlist-grid">

          {wishlist.map((product, index) => {

            const productId =
              getProductId(product);

            const price =
              Number(product.price) || 0;

            const originalPrice =
              Number(product.originalPrice) || 0;

            const stock =
              Number(product.stock) || 0;

            const isOutOfStock =
              stock <= 0;

            const discount =
              originalPrice > price
                ? Math.round(
                    ((originalPrice - price) /
                      originalPrice) *
                      100
                  )
                : 0;

            return (
              <article
                className="wishlist-card"
                key={productId}
              >

                {/* =================================
                    IMAGE
                ================================= */}

                <div className="wishlist-image">

                  <Link
                    to={`/product/${productId}`}
                  >

                    <img
                      src={
                        product.image ||
                        "/images/product-placeholder.jpg"
                      }
                      alt={
                        product.name ||
                        "Product"
                      }
                      loading="lazy"
                    />

                  </Link>


                  {/* DISCOUNT */}

                  {discount > 0 &&
                    !isOutOfStock && (
                      <span className="wishlist-discount">
                        -{discount}%
                      </span>
                    )}


                  {/* OUT OF STOCK */}

                  {isOutOfStock && (
                    <span className="wishlist-stock-badge">
                      OUT OF STOCK
                    </span>
                  )}


                  {/* INDEX */}

                  <span className="wishlist-index">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>


                  {/* HEART */}

                  <button
                    type="button"
                    className="wishlist-heart"
                    onClick={() =>
                      toggleWishlist(product)
                    }
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    ♥
                  </button>

                </div>


                {/* =================================
                    PRODUCT INFORMATION
                ================================= */}

                <div className="wishlist-card-info">

                  <p className="wishlist-category">
                    {product.category ||
                      "COLLECTION"}
                  </p>


                  <Link
                    to={`/product/${productId}`}
                    className="wishlist-product-link"
                  >

                    <h2>
                      {product.name ||
                        "Product"}
                    </h2>

                  </Link>


                  {/* PRICE */}

                  <div className="wishlist-price-row">

                    <strong>
                      ₹
                      {price.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    {originalPrice > price && (
                      <span>
                        ₹
                        {originalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}

                  </div>


                  {/* STOCK */}

                  {isOutOfStock ? (
                    <p className="wishlist-stock-warning">
                      This product is currently
                      unavailable.
                    </p>
                  ) : (
                    <p className="wishlist-stock-available">
                      ✓ AVAILABLE
                    </p>
                  )}


                  {/* ACTIONS */}

                  <div className="wishlist-actions">

                    <button
                      type="button"
                      className={`wishlist-cart-button ${
                        isOutOfStock
                          ? "wishlist-cart-disabled"
                          : ""
                      }`}
                      onClick={() =>
                        moveToCart(product)
                      }
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock
                        ? "OUT OF STOCK"
                        : "MOVE TO CART →"}
                    </button>

                    <button
                      type="button"
                      className="wishlist-remove-button"
                      onClick={() =>
                        toggleWishlist(product)
                      }
                    >
                      REMOVE
                    </button>

                  </div>

                </div>

              </article>
            );
          })}

        </div>

      </section>

    </main>
  );
}

export default Wishlist;