import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api/apiConfig";

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
          throw new Error(data.message || "Failed to fetch orders");
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

  // ================================
  // CANCEL ORDER
  // ================================

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to cancel order"
        );
      }

      // Update the cancelled order in the existing list
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? data.order
            : order
        )
      );

      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancel order error:", error);
      alert(error.message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // ================================
  // LOADING
  // ================================

  if (loading) {
    return (
      <main className="my-orders-page">
        <div className="orders-loading">
          <span>MICKEY MOUSE • ORDERS</span>
          <h1>Loading Orders...</h1>
        </div>
      </main>
    );
  }

  // ================================
  // ERROR
  // ================================

  if (error) {
    return (
      <main className="my-orders-page">
        <div className="orders-error">
          <span>ORDER HISTORY • ERROR</span>

          <h1>Unable to Load Orders</h1>

          <p>{error}</p>

          <Link to="/" className="orders-back-button">
            ← BACK TO HOME
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="my-orders-page">

      {/* PAGE HEADER */}

      <section className="orders-header">

        <div className="orders-header-content">

          <p>MICKEY MOUSE • ORDER HISTORY</p>

          <h1>
            MY
            <br />
            ORDERS.
          </h1>

          <span>
            Track your purchases and view the details of
            everything you've ordered.
          </span>

        </div>

        <div className="orders-header-mark">
          <span>MM</span>
        </div>

      </section>


      {/* EMPTY STATE */}

      {orders.length === 0 ? (

        <section className="orders-empty">

          <div className="orders-empty-icon">
            📦
          </div>

          <p>YOUR ORDER HISTORY</p>

          <h2>No Orders Yet</h2>

          <span>
            You haven't placed any orders yet.
            Start exploring our collection and find
            something you love.
          </span>

          <Link
            to="/shop"
            className="orders-shop-button"
          >
            START SHOPPING →
          </Link>

        </section>

      ) : (

        /* ORDERS */

        <section className="orders-content">

          <div className="orders-topbar">

            <div>

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
              className="orders-shop-link"
            >
              CONTINUE SHOPPING →
            </Link>

          </div>


          <div className="orders-list">

            {orders.map((order, index) => {

              const orderDate = new Date(
                order.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              // Orders that customers are allowed to cancel

              return (

                <article
                  className="my-order-card"
                  key={order._id}
                >

                  {/* ORDER HEADER */}

                  <div className="my-order-header">

                    <div className="my-order-number">

                      <span>
                        ORDER{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>
                        #{order._id
                          .slice(-8)
                          .toUpperCase()}
                      </h3>

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
                        {order.totalAmount?.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* STATUS */}

                  <div className="my-order-status">

                    <div className="status-item">

                      <span>PAYMENT</span>

                      <strong
                        className={`status-badge ${
                          order.paymentStatus === "paid"
                            ? "status-paid"
                            : "status-pending"
                        }`}
                      >
                        {order.paymentStatus}
                      </strong>

                    </div>


                    <div className="status-item">

                      <span>ORDER STATUS</span>

                      <strong
                        className={`status-badge status-${order.orderStatus}`}
                      >
                        {order.orderStatus}
                      </strong>

                    </div>

                  </div>


                  {/* PRODUCTS */}

                  <div className="my-order-products">

                    <div className="my-order-products-heading">

                      <span>PRODUCT</span>
                      <span>QTY</span>
                      <span>PRICE</span>

                    </div>


                    {order.items.map((item) => (

                      <div
                        className="my-order-product"
                        key={item._id}
                      >

                        <div className="my-order-product-name">

                          {item.productId?.image && (
                            <img
                              src={item.productId.image}
                              alt={
                                item.productId?.name ||
                                "Product"
                              }
                            />
                          )}

                          <div>

                            <strong>
                              {item.productId?.name ||
                                item.name ||
                                "Product"}
                            </strong>

                            {item.size && (
                              <span>
                                Size: {item.size}
                              </span>
                            )}

                          </div>

                        </div>


                        <span>
                          ×{item.quantity}
                        </span>


                        <strong>
                          ₹
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString("en-IN")}
                        </strong>

                      </div>

                    ))}

                  </div>


                  {/* FOOTER */}

                  <div className="my-order-footer">

                    <span>
                      {order.items.length}{" "}
                      {order.items.length === 1
                        ? "ITEM"
                        : "ITEMS"}
                    </span>


                    <div className="my-order-actions">

                      <Link
                        to={`/orders/${order._id}`}
                        className="view-order-button"
                      >
                        VIEW ORDER DETAILS →
                      </Link>


                      {/* CANCEL BUTTON */}

                     

                    </div>

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