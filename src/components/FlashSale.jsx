import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api/apiConfig";
import "./FlashSale.css";

function FlashSale() {
  const [products, setProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/products/flash-sales`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch flash sales"
          );
        }

        setProducts(data);
      } catch (error) {
        console.error("Flash sale error:", error);
        setProducts([]);
      }
    };

    fetchFlashSales();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const updateCountdown = () => {
      const now = Date.now();
      const updated = {};

      products.forEach((product) => {
        const remaining =
          new Date(product.saleEnd).getTime() - now;

        if (remaining > 0) {
          const totalSeconds = Math.floor(remaining / 1000);

          updated[product._id] = {
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
          };
        }
      });

      setTimeLeft(updated);
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [products]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="flash-sale-section">
      <div className="flash-sale-header">
        <div>
          <span className="flash-sale-eyebrow">
            LIMITED TIME ONLY
          </span>

          <h2>FLASH SALE</h2>

          <p>
            Exclusive prices. Limited stock. Don't miss out.
          </p>
        </div>

        <div className="flash-sale-badge">
          ⚡ LIVE NOW
        </div>
      </div>

      <div className="flash-sale-grid">
        {products.map((product) => {
          const countdown = timeLeft[product._id];

          if (!countdown) return null;

          return (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="flash-sale-card"
            >
              <div className="flash-sale-image">
                <span className="flash-sale-discount">
                  -{product.discount}%
                </span>

                <img
                  src={product.image}
                  alt={product.name}
                />
              </div>

              <div className="flash-sale-info">
                <span className="flash-sale-category">
                  {product.category}
                </span>

                <h3>{product.name}</h3>

                <div className="flash-sale-prices">
                  <strong>
                    ₹{product.salePrice.toLocaleString("en-IN")}
                  </strong>

                  <del>
                    ₹
                    {product.originalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </del>
                </div>

                <div className="flash-sale-countdown">
                  <span>SALE ENDS IN</span>

                  <div className="countdown-boxes">
                    <div>
                      <strong>
                        {String(countdown.days).padStart(2, "0")}
                      </strong>
                      <small>DAYS</small>
                    </div>

                    <b>:</b>

                    <div>
                      <strong>
                        {String(countdown.hours).padStart(2, "0")}
                      </strong>
                      <small>HRS</small>
                    </div>

                    <b>:</b>

                    <div>
                      <strong>
                        {String(countdown.minutes).padStart(2, "0")}
                      </strong>
                      <small>MIN</small>
                    </div>

                    <b>:</b>

                    <div>
                      <strong>
                        {String(countdown.seconds).padStart(2, "0")}
                      </strong>
                      <small>SEC</small>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default FlashSale;