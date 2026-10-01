import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api/apiConfig";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/orders/my-orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch orders"
          );
        }

        setOrders(data);
      } catch (error) {
        console.error("My orders error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="my-orders-page">
        <section className="orders-loading">
          <div className="orders-loading-mark">SW</div>

          <span>SPACE WEAR • ORDER HISTORY</span>

          <h1>Loading Orders...</h1>

          <div className="orders-loader" />
        </section>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <main className="my-orders-page">
        <section className="orders-error">
          <div className="orders-error-icon">!</div>

          <span>SPACE WEAR • ORDER HISTORY</span>

          <h1>Unable to Load Orders</h1>

          <p>{error}</p>

          <div className="orders-error-actions">
            <Link to="/" className="orders-primary-button">
              ← BACK TO HOME
            </Link>

            <Link to="/login" className="orders-secondary-button">
              LOGIN AGAIN
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="my-orders-page">

      {/* =========================
          HERO HEADER
      ========================= */}

      <section className="orders-hero">

        <div className="orders-hero-content">

          <Link
            to="/"
            className="orders-home-link"
          >
            ← BACK TO HOME
          </Link>

          <p className="orders-eyebrow">
            SPACE WEAR • ORDER HISTORY
          </p>

          <h1>
            MY
            <br />
            <span>ORDERS.</span>
          </h1>

          <p className="orders-hero-description">
            Track your purchases, check delivery
            status and view your complete order history.
          </p>

        </div>

        <div className="orders-hero-mark">
          <span>SW</span>
          <small>SPACE<br />WEAR</small>
        </div>

      </section>


      {/* =========================
          EMPTY STATE
      ========================= */}

      {orders.length === 0 ? (

        <section className="orders-empty">

          <div className="orders-empty-icon">
            <span>🛍️</span>
          </div>

          <p>YOUR ORDER HISTORY</p>

          <h2>No Orders Yet</h2>

          <span>
            You haven't placed any orders yet.
            Explore our latest collection and
            find something made for you.
          </span>

          <Link
            to="/shop"
            className="orders-shop-button"
          >
            START SHOPPING
            <span>→</span>
          </Link>

        </section>

      ) : (

        <section className="orders-content">

          {/* =========================
              TOP BAR
          ========================= */}

          <div className="orders-topbar">

            <div className="orders-count">

              <span>YOUR PURCHASES</span>

              <h2>
                {orders.length}{" "}
                {orders.length === 1
                  ? "ORDER"
                  : "ORDERS"}
              </h2>

            </div>

            <Link
              to="/shop"
              className="orders-continue"
            >
              CONTINUE SHOPPING
              <span>→</span>
            </Link>

          </div>


          {/* =========================
              ORDERS LIST
          ========================= */}

          <div className="orders-list">

            {orders.map((order, index) => {

              const orderDate = new Date(
                order.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              const orderNumber =
                order._id
                  ?.slice(-8)
                  .toUpperCase();

              const totalAmount =
                Number(order.totalAmount || 0);

              return (
                <article
                  className="my-order-card"
                  key={order._id}
                >

                  {/* =========================
                      ORDER TOP
                  ========================= */}

                  <div className="my-order-top">

                    <div className="my-order-index">
                      <span>
                        ORDER
                      </span>

                      <strong>
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </strong>
                    </div>

                    <div className="my-order-id">
                      <span>ORDER ID</span>

                      <strong>
                        #{orderNumber}
                      </strong>
                    </div>

                    <div className="my-order-date">
                      <span>ORDER DATE</span>

                      <strong>
                        {orderDate}
                      </strong>
                    </div>

                    <div className="my-order-total">
                      <span>TOTAL</span>

                      <strong>
                        ₹
                        {totalAmount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                  </div>


                  {/* =========================
                      STATUS ROW
                  ========================= */}

                  <div className="my-order-status-row">

                    <div className="my-order-status-group">

                      <span>
                        PAYMENT
                      </span>

                      <strong
                        className={`order-status-badge ${
                          order.paymentStatus === "paid"
                            ? "status-success"
                            : "status-warning"
                        }`}
                      >
                        {order.paymentStatus === "paid"
                          ? "✓ PAID"
                          : (
                              order.paymentStatus ||
                              "PENDING"
                            ).toUpperCase()}
                      </strong>

                    </div>


                    <div className="my-order-status-group">

                      <span>
                        ORDER STATUS
                      </span>

                      <strong
                        className={`order-status-badge status-${order.orderStatus}`}
                      >
                        {(
                          order.orderStatus ||
                          "pending"
                        )
                          .replaceAll("_", " ")
                          .toUpperCase()}
                      </strong>

                    </div>

                  </div>


                  {/* =========================
                      PRODUCTS
                  ========================= */}

                  <div className="my-order-items">

                    <div className="my-order-items-header">
                      <span>
                        PRODUCTS
                      </span>

                      <span>
                        {order.items.length}{" "}
                        {order.items.length === 1
                          ? "ITEM"
                          : "ITEMS"}
                      </span>
                    </div>


                    <div className="my-order-products">

                      {order.items.map((item) => (

                        <div
                          className="my-order-product"
                          key={item._id}
                        >

                          {/* IMAGE */}

                          <div className="my-order-product-image">

                            {item.image ? (
                              <img
                                src={item.image}
                                alt={
                                  item.name ||
                                  "Product"
                                }
                                loading="lazy"
                              />
                            ) : (
                              <span>SW</span>
                            )}

                          </div>


                          {/* INFO */}

                          <div className="my-order-product-info">

                            <span>
                              {item.category ||
                                "SPACE WEAR"}
                            </span>

                            <strong>
                              {item.name ||
                                "Product"}
                            </strong>

                            {item.size && (
                              <small>
                                SIZE: {item.size}
                              </small>
                            )}

                          </div>


                          {/* QUANTITY */}

                          <div className="my-order-product-quantity">

                            <span>
                              QTY
                            </span>

                            <strong>
                              ×{item.quantity}
                            </strong>

                          </div>


                          {/* PRICE */}

                          <div className="my-order-product-price">

                            <span>
                              PRICE
                            </span>

                            <strong>
                              ₹
                              {(
                                Number(
                                  item.price || 0
                                ) *
                                Number(
                                  item.quantity || 0
                                )
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>


                  {/* =========================
                      FOOTER
                  ========================= */}

                  <div className="my-order-footer">

                    <div className="my-order-footer-info">

                      <span>
                        {order.items.length}{" "}
                        {order.items.length === 1
                          ? "PRODUCT"
                          : "PRODUCTS"}
                      </span>

                      <span>
                        SPACE WEAR
                      </span>

                    </div>


                    <Link
                      to={`/orders/${order._id}`}
                      className="view-order-button"
                    >
                      VIEW ORDER DETAILS
                      <span>→</span>
                    </Link>

                  </div>

                </article>
              );
            })}

          </div>

        </section>
      )}

    </main>
  );
}

export default MyOrders;