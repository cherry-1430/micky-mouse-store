import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API_URL from "../api/apiConfig";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/orders/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch order");
        }

        setOrder(data);
      } catch (error) {
        console.error("Order details error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this order?"
  );

  if (!confirmed) return;

  try {
    setCancelling(true);
    setCancelError("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/orders/${id}/cancel`,
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

    setOrder(data.order);

    alert("Order cancelled successfully.");
  } catch (error) {
    console.error("Cancel order error:", error);
    setCancelError(error.message);
  } finally {
    setCancelling(false);
  }
};

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-loading">
          <span>MICKEY MOUSE • ORDER</span>
          <h1>Loading Order...</h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="order-details-page">
        <div className="order-details-error">
          <span>ORDER • ERROR</span>
          <h1>Unable to Load Order</h1>
          <p>{error}</p>

          <Link to="/my-orders">
            ← BACK TO MY ORDERS
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const orderTime = new Date(order.createdAt).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <main className="order-details-page">

      {/* HEADER */}

      <section className="order-details-header">

        <div className="order-details-header-content">

          <Link
            to="/my-orders"
            className="order-details-back"
          >
            ← MY ORDERS
          </Link>

          <p>MICKEY MOUSE • ORDER CONFIRMATION</p>

          <h1>
            ORDER
            <br />
            DETAILS.
          </h1>

          <span>
            Complete information about your purchase,
            payment and delivery.
          </span>

        </div>

        <div className="order-details-header-mark">
          <span>MM</span>
        </div>

      </section>


      {/* ORDER OVERVIEW */}

      <section className="order-details-content">

        <div className="order-overview">

          <div>
            <span>ORDER ID</span>
            <strong>
              #{order._id.slice(-8).toUpperCase()}
            </strong>
          </div>

          <div>
            <span>DATE</span>
            <strong>{orderDate}</strong>
          </div>

          <div>
            <span>TIME</span>
            <strong>{orderTime}</strong>
          </div>

          <div>
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

        <div className="order-status-panel">

          <div className="order-status-heading">
            <div>
              <span>ORDER PROGRESS</span>
              <h2>YOUR ORDER STATUS</h2>
            </div>

            <span
              className={`details-status-badge status-${order.orderStatus}`}
            >
              {order.orderStatus}
            </span>
          </div>


          <div className="order-progress">

            <div
              className={`progress-step ${
                [
                  "confirmed",
                  "processing",
                  "shipped",
                  "delivered",
                ].includes(order.orderStatus)
                  ? "completed"
                  : ""
              }`}
            >
              <span>01</span>
              <strong>CONFIRMED</strong>
            </div>

            <div
              className={`progress-step ${
                [
                  "processing",
                  "shipped",
                  "delivered",
                ].includes(order.orderStatus)
                  ? "completed"
                  : ""
              }`}
            >
              <span>02</span>
              <strong>PROCESSING</strong>
            </div>

            <div
              className={`progress-step ${
                [
                  "shipped",
                  "delivered",
                ].includes(order.orderStatus)
                  ? "completed"
                  : ""
              }`}
            >
              <span>03</span>
              <strong>SHIPPED</strong>
            </div>

            <div
              className={`progress-step ${
                order.orderStatus === "delivered"
                  ? "completed"
                  : ""
              }`}
            >
              <span>04</span>
              <strong>DELIVERED</strong>
            </div>

          </div>

        </div>


        {/* MAIN GRID */}

        <div className="order-details-grid">

          {/* PRODUCTS */}

          <section className="order-products-section">

            <div className="order-section-heading">
              <div>
                <span>YOUR PURCHASE</span>
                <h2>ORDERED ITEMS</h2>
              </div>

              <span>
                {order.items.length}{" "}
                {order.items.length === 1
                  ? "ITEM"
                  : "ITEMS"}
              </span>
            </div>


            <div className="order-detail-items">

              {order.items.map((item) => (

                <div
                  className="order-detail-item"
                  key={item._id}
                >

                  <div className="order-detail-image">

                    {item.productId?.image ? (
                      <img
                        src={item.productId.image}
                        alt={
                          item.productId?.name ||
                          "Product"
                        }
                      />
                    ) : (
                      <span>MM</span>
                    )}

                  </div>


                  <div className="order-detail-product-info">

                    <span>
                      {item.productId?.category ||
                        "MICKEY MOUSE"}
                    </span>

                    <h3>
                      {item.productId?.name ||
                        "Product"}
                    </h3>

                    {item.size && (
                      <p>
                        SIZE: <strong>{item.size}</strong>
                      </p>
                    )}

                    <p>
                      QUANTITY:{" "}
                      <strong>{item.quantity}</strong>
                    </p>

                  </div>


                  <div className="order-detail-item-price">

                    <span>
                      ₹
                      {item.price?.toLocaleString(
                        "en-IN"
                      )}{" "}
                      / ITEM
                    </span>

                    <strong>
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toLocaleString("en-IN")}
                    </strong>

                  </div>

                </div>

              ))}

            </div>

          </section>


          {/* SUMMARY */}

          <aside className="order-summary-section">

            <span className="order-summary-label">
              PAYMENT
            </span>

            <h2>ORDER SUMMARY</h2>


            <div className="order-summary-row">
              <span>Subtotal</span>
              <strong>
                ₹
                {order.totalAmount?.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="order-summary-row">
              <span>Shipping</span>
              <strong>FREE</strong>
            </div>


            <div className="order-summary-divider"></div>


            <div className="order-summary-total">
              <span>TOTAL</span>

              <strong>
                ₹
                {order.totalAmount?.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>


            <div className="payment-status-box">

              <span>PAYMENT STATUS</span>

              <strong
                className={
                  order.paymentStatus === "paid"
                    ? "payment-paid"
                    : "payment-unpaid"
                }
              >
                {order.paymentStatus === "paid"
                  ? "✓ PAYMENT CONFIRMED"
                  : order.paymentStatus}
              </strong>

            </div>

          </aside>


          {/* SHIPPING */}

          <section className="shipping-details-section">

            <div className="order-section-heading">

              <div>
                <span>DELIVERY INFORMATION</span>
                <h2>SHIPPING ADDRESS</h2>
              </div>

              <span>01</span>

            </div>


            <div className="shipping-address">

              <strong>
                {order.shippingAddress?.name ||
                  order.userId?.name ||
                  "Customer"}
              </strong>

              <p>
                {order.shippingAddress?.address}
                <br />
                {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.state}
                <br />
                PIN:{" "}
                {order.shippingAddress?.pincode}
              </p>

              {order.shippingAddress?.phone && (
                <p>
                  PHONE:{" "}
                  {order.shippingAddress.phone}
                </p>
              )}

            </div>

          </section>

        </div>


        {/* FOOTER ACTIONS */}

        {cancelError && (
  <p className="order-cancel-error">
    {cancelError}
  </p>
)}

        <div className="order-details-actions">

  <Link
    to="/my-orders"
    className="order-details-orders-button"
  >
    ← MY ORDERS
  </Link>

  {["pending", "confirmed", "processing"].includes(
    order.orderStatus
  ) && (
    <button
      type="button"
      className="cancel-order-button"
      onClick={handleCancelOrder}
      disabled={cancelling}
    >
      {cancelling ? "CANCELLING..." : "CANCEL ORDER"}
    </button>
  )}

  <Link
    to="/shop"
    className="order-details-shop-button"
  >
    CONTINUE SHOPPING →
  </Link>

</div>

      </section>

    </main>
  );
}

export default OrderDetails;