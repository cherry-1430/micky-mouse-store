import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../api/productApi";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

function ProductSection() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

const [selectedProduct, setSelectedProduct] = useState(null);
const [selectedSize, setSelectedSize] = useState("");

  // ==========================================
  // LOAD FEATURED PRODUCTS
  // ==========================================

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();

        const featuredProducts = data
          .filter((product) => product.isFeatured)
          .slice(0, 4);

        setProducts(featuredProducts);
      } catch (error) {
        console.error(
          "Failed to load featured products:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="product-section">

      {/* =====================================
          SECTION HEADING
          ===================================== */}

      <div className="section-heading">

        <p>OUR BEST PICKS</p>

        <h2>FEATURED PRODUCTS</h2>

        <span>
          Discover some of our most-loved styles.
        </span>

      </div>

      {/* =====================================
          LOADING
          ===================================== */}

      {loading ? (

        <div className="product-grid">

          {[1, 2, 3, 4].map((item) => (

            <div
              className="product-card product-skeleton"
              key={item}
            >

              <div className="product-image skeleton-image">
              </div>

              <div className="product-info">

                <div className="skeleton-line short">
                </div>

                <div className="skeleton-line">
                </div>

                <div className="skeleton-line price">
                </div>

              </div>

            </div>

          ))}

        </div>

      ) : products.length === 0 ? (

        /* =====================================
           EMPTY
           ===================================== */

        <div className="product-empty">

          <h3>
            NO FEATURED PRODUCTS
          </h3>

          <p>
            Check back soon for our latest
            collection.
          </p>

          <Link to="/shop">
            SHOP ALL PRODUCTS →
          </Link>

        </div>

      ) : (

        /* =====================================
           PRODUCTS
           ===================================== */

        <div className="product-grid">

          {products.map((product, index) => (

            <div
              className="product-card"
              key={product._id}
            >

              {/* =================================
                  PRODUCT IMAGE
                  ================================= */}

              <div className="product-image">

                <img
                  src={product.image}
                  alt={product.name}
                />

                <div className="product-number">
                  0{index + 1}
                </div>

                {/* WISHLIST */}

                <button
                  className="wishlist-button"
                  aria-label={
                    isInWishlist(product._id)
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  onClick={(e) => {

                    e.preventDefault();
                    e.stopPropagation();

                    toggleWishlist(product);

                  }}
                >
                  {isInWishlist(product._id)
                    ? "♥"
                    : "♡"}
                </button>

                {/* PRODUCT OVERLAY */}

                <div className="product-overlay">

                  <Link
                    to={`/product/${product._id}`}
                  >
                    VIEW PRODUCT →
                  </Link>

                </div>

              </div>

              {/* =================================
                  PRODUCT INFORMATION
                  ================================= */}

              <div className="product-info">

                <p className="product-category">
                  {product.category}
                </p>

                <h3>
                  {product.name}
                </h3>

                <div className="product-bottom">

                  {/* PRICE */}

                  <p className="product-price">

                    ₹
                    {Number(
                      product.price
                    ).toLocaleString("en-IN")}

                  </p>

                  {/* ADD TO CART */}

                <button
  className="add-cart-button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedProduct(product);
    setSelectedSize("");
  }}
>
  ADD TO CART
</button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* =====================================
          VIEW ALL PRODUCTS
          ===================================== */}

      {!loading &&
        products.length > 0 && (

          <div className="product-section-footer">

            <Link
              to="/shop"
              className="view-all-products"
            >
              VIEW ALL PRODUCTS →
            </Link>

          </div>

        )}

        {selectedProduct && (
  <div
    className="size-modal-overlay"
    onClick={() => setSelectedProduct(null)}
  >
    <div
      className="size-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className="size-modal-close"
        onClick={() => setSelectedProduct(null)}
      >
        ×
      </button>

      <p>SELECT SIZE</p>

      <h3>
        {selectedProduct.name}
      </h3>

      <div className="size-modal-options">

        {selectedProduct.sizes?.map((size) => (
          <button
            key={size}
            className={
              selectedSize === size
                ? "selected-size"
                : ""
            }
            onClick={() =>
              setSelectedSize(size)
            }
          >
            {size}
          </button>
        ))}

      </div>

     <button
  className="size-modal-add"
  disabled={!selectedSize}
  onClick={() => {
    if (!selectedSize) return;

    addToCart(selectedProduct, selectedSize, 1);

    setSelectedProduct(null);
    setSelectedSize("");
  }}
>
  {selectedSize
    ? `ADD ${selectedSize} TO CART →`
    : "SELECT A SIZE"}
</button>

    </div>
  </div>
)}

    </section>
  );
}

export default ProductSection;