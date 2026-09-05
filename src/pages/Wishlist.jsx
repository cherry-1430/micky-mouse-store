import { Link } from "react-router-dom";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = (product) => {
    if (!product.sizes || product.sizes.length === 0) {
      alert("Size information is not available.");
      return;
    }

    const defaultSize = product.sizes[0];

    addToCart(product, defaultSize, 1);
    toggleWishlist(product);

    alert(`${product.name} moved to cart`);
  };

  if (wishlist.length === 0) {
    return (
      <main className="empty-wishlist">

        <div className="empty-wishlist-content">

          <div className="empty-wishlist-icon">
            ♡
          </div>

          <p className="empty-wishlist-label">
            MICKEY MOUSE • SAVED ITEMS
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

  return (
    <main className="wishlist-page">

      {/* HEADER */}

      <section className="wishlist-header">

        <div className="wishlist-header-content">

          <p>
            MICKEY MOUSE • SAVED COLLECTION
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


      {/* WISHLIST CONTENT */}

      <section className="wishlist-content">

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


        {/* PRODUCTS */}

        <div className="wishlist-grid">

          {wishlist.map((product, index) => (

            <article
              className="wishlist-card"
              key={product._id || product.id}
            >

              <div className="wishlist-image">

                <Link to={`/product/${product._id || product.id}`}>

                  <img
                    src={product.image}
                    alt={product.name}
                  />

                </Link>

                <span className="wishlist-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <button
                  className="wishlist-heart"
                  onClick={() => toggleWishlist(product)}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  ♥
                </button>

              </div>


              {/* INFO */}

              <div className="wishlist-card-info">

                <p className="wishlist-category">
                  {product.category}
                </p>

                <Link
                  to={`/product/${product.id}`}
                  className="wishlist-product-link"
                >
                  <h2>
                    {product.name}
                  </h2>
                </Link>

                <div className="wishlist-price-row">

                  <strong>
                    ₹
                    {product.price?.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  {product.originalPrice &&
                    product.originalPrice >
                      product.price && (
                      <span>
                        ₹
                        {product.originalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}

                </div>


                {/* ACTIONS */}

                <div className="wishlist-actions">

                  <button
                    className="wishlist-cart-button"
                    onClick={() =>
                      moveToCart(product)
                    }
                  >
                    MOVE TO CART →
                  </button>

                  <button
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

          ))}

        </div>

      </section>

    </main>
  );
}

export default Wishlist;