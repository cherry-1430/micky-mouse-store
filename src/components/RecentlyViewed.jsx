import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function RecentlyViewed() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      const saved =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];

      setProducts(saved);
    } catch (error) {
      console.error("Recently viewed load error:", error);
    }
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed-section">

      <div className="recently-viewed-heading">

        <div>
          <span>YOUR BROWSING HISTORY</span>
          <h2>RECENTLY VIEWED</h2>
        </div>

        <span className="recently-viewed-count">
          {products.length} ITEMS
        </span>

      </div>

      <div className="recently-viewed-grid">

        {products.map((product) => (

          <Link
            key={product._id}
            to={`/product/${product._id}`}
            className="recently-viewed-card"
          >

            <div className="recently-viewed-image">

              <img
                src={product.image}
                alt={product.name}
              />

            </div>

            <div className="recently-viewed-info">

              <span className="recently-viewed-category">
                {product.category}
              </span>

              <h3>{product.name}</h3>

              <div className="recently-viewed-rating">

                <span>
                  {"★".repeat(
                    Math.round(product.rating || 0)
                  )}

                  {"☆".repeat(
                    5 - Math.round(product.rating || 0)
                  )}
                </span>

                <small>
                  ({product.reviewCount || 0})
                </small>

              </div>

              <div className="recently-viewed-price">

                {Number(product.originalPrice || 0) > Number(product.price || 0) && (
  <del>
    ₹{Number(product.originalPrice).toLocaleString("en-IN")}
  </del>
)}

                {product.originalPrice > product.price && (
                  <del>
                    ₹
                    {product.originalPrice?.toLocaleString(
                      "en-IN"
                    )}
                  </del>
                )}

              </div>

            </div>

          </Link>

        ))}

      </div>

    </section>
  );
}

export default RecentlyViewed;