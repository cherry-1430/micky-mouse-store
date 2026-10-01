import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RecentlyViewed.css";

function RecentlyViewed({ currentProductId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      const saved =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];

      if (!Array.isArray(saved)) {
        setProducts([]);
        return;
      }

      // Remove current product from the list
      const filtered = saved
        .filter(
          (product) =>
            product &&
            product._id &&
            product._id !== currentProductId
        )
        .slice(0, 8);

      setProducts(filtered);
    } catch (error) {
      console.error("Recently viewed load error:", error);
      setProducts([]);
    }
  }, [currentProductId]);

  // Don't show section if there are no previous products
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed-section">

      {/* ================================
          HEADER
      ================================= */}

      <div className="recently-viewed-heading">

        <div>
          <span>YOUR BROWSING HISTORY</span>

          <h2>RECENTLY VIEWED</h2>
        </div>

        <span className="recently-viewed-count">
          {products.length}{" "}
          {products.length === 1 ? "ITEM" : "ITEMS"}
        </span>

      </div>


      {/* ================================
          PRODUCTS
      ================================= */}

      <div className="recently-viewed-grid">

        {products.map((product) => {

          const rating = Math.min(
            5,
            Math.max(
              0,
              Math.round(Number(product.rating) || 0)
            )
          );

          const price =
            Number(product.price) || 0;

          const originalPrice =
            Number(product.originalPrice) || 0;

          const discount =
            originalPrice > price && originalPrice > 0
              ? Math.round(
                  ((originalPrice - price) /
                    originalPrice) *
                    100
                )
              : 0;

          return (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="recently-viewed-card"
            >

              {/* ================================
                  IMAGE
              ================================= */}

              <div className="recently-viewed-image">

                {discount > 0 && (
                  <span className="recently-viewed-discount">
                    -{discount}%
                  </span>
                )}

                <img
                  src={
                    product.image ||
                    "/images/product-placeholder.jpg"
                  }
                  alt={product.name || "Product"}
                  loading="lazy"
                />

              </div>


              {/* ================================
                  PRODUCT INFORMATION
              ================================= */}

              <div className="recently-viewed-info">

                <span className="recently-viewed-category">
                  {product.category || "COLLECTION"}
                </span>

                <h3>
                  {product.name || "Product"}
                </h3>


                {/* RATING */}

                <div className="recently-viewed-rating">

                  <span>
                    {"★".repeat(rating)}
                    {"☆".repeat(5 - rating)}
                  </span>

                  <small>
                    ({Number(product.reviewCount) || 0})
                  </small>

                </div>


                {/* PRICE */}

                <div className="recently-viewed-price">

                  <strong>
                    ₹{price.toLocaleString("en-IN")}
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

              </div>

            </Link>
          );
        })}

      </div>

    </section>
  );
}

export default RecentlyViewed;