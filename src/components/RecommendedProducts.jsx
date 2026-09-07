import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api/apiConfig";
import "./RecommendedProducts.css";

function RecommendedProducts({ productId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/products/recommendations/${productId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch recommendations"
          );
        }

        setProducts(data);
      } catch (error) {
        console.error("Recommendation error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchRecommendations();
    }
  }, [productId]);

  if (loading) {
    return (
      <section className="recommended-products">
        <div className="recommended-heading">
          <span>CURATED FOR YOU</span>
          <h2>YOU MAY ALSO LIKE</h2>
        </div>

        <div className="recommendation-loading">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="recommended-products">
      <div className="recommended-heading">
        <div>
          <span>CURATED FOR YOU</span>
          <h2>YOU MAY ALSO LIKE</h2>
        </div>

        <p>DISCOVER MORE FAVORITES</p>
      </div>

      <div className="recommendation-grid">
        {products.map((product) => {
          const rating = Math.round(product.rating || 0);

          const discount =
            product.originalPrice > product.price
              ? Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )
              : 0;

          return (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="recommendation-card"
            >
              <div className="recommendation-image">
                {discount > 0 && (
                  <span className="recommendation-discount">
                    -{discount}%
                  </span>
                )}

                <img
                  src={product.image}
                  alt={product.name}
                />
              </div>

              <div className="recommendation-info">
                <span className="recommendation-category">
                  {product.category}
                </span>

                <h3>{product.name}</h3>

                <div className="recommendation-rating">
                  <span>
                    {"★".repeat(rating)}
                    {"☆".repeat(5 - rating)}
                  </span>

                  <small>
                    ({product.reviewCount || 0})
                  </small>
                </div>

                <div className="recommendation-price">
                  <strong>
                    ₹{product.price?.toLocaleString("en-IN")}
                  </strong>

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
          );
        })}
      </div>
    </section>
  );
}

export default RecommendedProducts;