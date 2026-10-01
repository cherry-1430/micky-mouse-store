import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../api/productApi";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

import "./ProductSection.css";

function ProductSection() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");

  const productImageRefs = useRef({});

  /* =========================================
     LOAD FEATURED PRODUCTS
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const data = await getProducts();

        if (!mounted) return;

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
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================
     CART ANIMATION
  ========================================= */

  const animateProductToCart = (product) => {
    const productElement =
      productImageRefs.current[product._id];

    const cartElement =
      document.getElementById("navbar-cart");

    if (!productElement || !cartElement) {
      return;
    }

    const imageElement =
      productElement.querySelector("img");

    if (!imageElement) {
      return;
    }

    const productRect =
      imageElement.getBoundingClientRect();

    const cartRect =
      cartElement.getBoundingClientRect();

    const flyingImage =
      imageElement.cloneNode(true);

    const startX =
      productRect.left;

    const startY =
      productRect.top;

    const moveX =
      cartRect.left +
      cartRect.width / 2 -
      (productRect.left +
        productRect.width / 2);

    const moveY =
      cartRect.top +
      cartRect.height / 2 -
      (productRect.top +
        productRect.height / 2);

    Object.assign(flyingImage.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${productRect.width}px`,
      height: `${productRect.height}px`,
      objectFit: "cover",
      borderRadius: "12px",
      zIndex: "999999",
      pointerEvents: "none",
      boxShadow:
        "0 12px 35px rgba(0,0,0,0.25)",
    });

    document.body.appendChild(flyingImage);

    const animation =
      flyingImage.animate(
        [
          {
            transform:
              "translate3d(0, 0, 0) scale(1)",
            opacity: 1,
          },
          {
            transform: `translate3d(
              ${moveX * 0.6}px,
              ${moveY * 0.6}px,
              0
            ) scale(0.6)`,
            opacity: 1,
          },
          {
            transform: `translate3d(
              ${moveX}px,
              ${moveY}px,
              0
            ) scale(0.15)`,
            opacity: 0.15,
          },
        ],
        {
          duration: 650,
          easing:
            "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }
      );

    animation.onfinish = () => {
      flyingImage.remove();

      cartElement.animate(
        [
          {
            transform: "scale(1)",
          },
          {
            transform: "scale(1.18)",
          },
          {
            transform: "scale(1)",
          },
        ],
        {
          duration: 250,
          easing: "ease-out",
        }
      );
    };
  };

  /* =========================================
     ADD TO CART
  ========================================= */

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize) {
      return;
    }

    addToCart(
      selectedProduct,
      selectedSize,
      1
    );

    animateProductToCart(
      selectedProduct
    );

    setSelectedProduct(null);
    setSelectedSize("");
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <section className="product-section">

        <div className="section-heading">
          <p>OUR BEST PICKS</p>

          <h2>FEATURED PRODUCTS</h2>

          <span>
            Discover some of our most-loved styles.
          </span>
        </div>

        <div className="product-grid">

          {[1, 2, 3, 4].map((item) => (
            <div
              className="product-card product-skeleton"
              key={item}
            >
              <div className="product-image skeleton-image" />

              <div className="product-info">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line price" />
              </div>
            </div>
          ))}

        </div>
      </section>
    );
  }

  /* =========================================
     EMPTY
  ========================================= */

  if (products.length === 0) {
    return (
      <section className="product-section">

        <div className="section-heading">
          <p>OUR BEST PICKS</p>
          <h2>FEATURED PRODUCTS</h2>
        </div>

        <div className="product-empty">

          <span>COMING SOON</span>

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

      </section>
    );
  }

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
          PRODUCT GRID
      ===================================== */}

      <div className="product-grid">

        {products.map((product, index) => {

          const rating = Math.min(
            5,
            Math.max(
              0,
              Math.round(
                Number(product.rating) || 0
              )
            )
          );

          const price =
            Number(product.price) || 0;

          const originalPrice =
            Number(product.originalPrice) || 0;

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
              className="product-card"
              key={product._id}
            >

              {/* IMAGE */}

              <div
                className="product-image"
                data-product-id={product._id}
                ref={(element) => {
                  if (element) {
                    productImageRefs.current[
                      product._id
                    ] = element;
                  }
                }}
              >

                <Link
                  to={`/product/${product._id}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                </Link>


                {/* DISCOUNT */}

                {discount > 0 && (
                  <span className="product-sale-badge">
                    -{discount}%
                  </span>
                )}


                {/* PRODUCT NUMBER */}

                <div className="product-number">
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>


                {/* WISHLIST */}

                <button
                  type="button"
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


                {/* HOVER OVERLAY */}

                <div className="product-overlay">

                  <Link
                    to={`/product/${product._id}`}
                  >
                    VIEW PRODUCT →
                  </Link>

                </div>

              </div>


              {/* PRODUCT INFORMATION */}

              <div className="product-info">

                <p className="product-category">
                  {product.category ||
                    "COLLECTION"}
                </p>

                <Link
                  to={`/product/${product._id}`}
                  className="product-name-link"
                >
                  <h3>
                    {product.name}
                  </h3>
                </Link>


                {/* RATING */}

                <div className="product-rating">

                  <span>
                    {"★".repeat(rating)}
                    {"☆".repeat(5 - rating)}
                  </span>

                  <small>
                    {Number(
                      product.rating || 0
                    ).toFixed(1)}

                    {" "}
                    (
                    {product.reviewCount ||
                      0}
                    )
                  </small>

                </div>


                {/* PRICE */}

                <div className="product-price-row">

                  <strong className="product-price">
                    ₹
                    {price.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  {originalPrice > price && (
                    <del>
                      ₹
                      {originalPrice.toLocaleString(
                        "en-IN"
                      )}
                    </del>
                  )}

                </div>


                {/* ADD TO CART */}

                {Number(product.stock) <= 0 ? (

                  <button
                    type="button"
                    className="add-cart-button disabled"
                    disabled
                  >
                    OUT OF STOCK
                  </button>

                ) : (

                  <button
                    type="button"
                    className="add-cart-button"
                    onClick={() => {
                      setSelectedProduct(
                        product
                      );
                      setSelectedSize("");
                    }}
                  >
                    ADD TO CART
                    <span>→</span>
                  </button>

                )}

              </div>

            </article>
          );
        })}

      </div>


      {/* =====================================
          VIEW ALL
      ===================================== */}

      <div className="product-section-footer">

        <Link
          to="/shop"
          className="view-all-products"
        >
          VIEW ALL PRODUCTS
          <span>→</span>
        </Link>

      </div>


      {/* =====================================
          SIZE MODAL
      ===================================== */}

      {selectedProduct && (
        <div
          className="size-modal-overlay"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div
            className="size-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="size-modal-close"
              onClick={() =>
                setSelectedProduct(null)
              }
              aria-label="Close"
            >
              ×
            </button>


            <span className="size-modal-label">
              SELECT SIZE
            </span>

            <h3>
              {selectedProduct.name}
            </h3>


            <div className="size-modal-options">

              {selectedProduct.sizes?.length > 0 ? (
                selectedProduct.sizes.map(
                  (size) => (
                    <button
                      type="button"
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
                  )
                )
              ) : (
                <p className="no-size-message">
                  No sizes available.
                </p>
              )}

            </div>


            <button
              type="button"
              className="size-modal-add"
              disabled={!selectedSize}
              onClick={handleAddToCart}
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