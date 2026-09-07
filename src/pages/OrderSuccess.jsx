import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  const order = location.state?.order;
  const payment = location.state?.payment;

  const orderId = order?._id;

  return (
    <main className="order-success-page">
      <div className="order-success-container">

        {/* SUCCESS */}

        <div className="success-icon">
          ✓
        </div>

        <p className="success-label">
          MICKEY MOUSE • ORDER CONFIRMED
        </p>

        <h1>
          THANK YOU.
        </h1>

        <p className="success-message">
          Your order has been successfully placed.
          <br />
          Your payment has been confirmed.
        </p>


        {/* ORDER CARD */}

        {order && (
          <div className="success-order-card">

            <div className="success-card-heading">
              <div>
                <span>YOUR PURCHASE</span>
                <h2>ORDER CONFIRMED</h2>
              </div>

              <span className="success-paid-badge">
                ✓ PAID
              </span>
            </div>


            <div className="success-order-info">

              <div className="success-info-item">
                <span>ORDER ID</span>
                <strong>
                  #{order._id.slice(-8).toUpperCase()}
                </strong>
              </div>


              {payment?.razorpay_payment_id && (
                <div className="success-info-item">
                  <span>PAYMENT ID</span>
                  <strong>
                    {payment.razorpay_payment_id}
                  </strong>
                </div>
              )}


              <div className="success-info-item">
                <span>STATUS</span>
                <strong className="success-confirmed">
                  {order.orderStatus || "CONFIRMED"}
                </strong>
              </div>


              <div className="success-info-item">
                <span>TOTAL PAID</span>
                <strong className="success-total">
                  ₹
                  {Number(order.totalAmount || 0).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>
              </div>

            </div>

          </div>
        )}


        {/* DELIVERY */}

        {order?.shippingAddress && (
          <div className="success-delivery">

            <div className="success-delivery-icon">
              →
            </div>

            <div className="success-delivery-content">

              <span className="success-section-label">
                DELIVERY ADDRESS
              </span>

              <strong>
                {order.customer?.firstName}{" "}
                {order.customer?.lastName}
              </strong>

              <p>
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
                <br />
                PIN: {order.shippingAddress.pincode}
              </p>

            </div>

          </div>
        )}


        {/* NEXT STEP */}

        {orderId && (
          <div className="success-next-step">

            <span>
              WHAT'S NEXT?
            </span>

            <h3>
              WE'LL KEEP YOU UPDATED.
            </h3>

            <p>
              Track your order anytime and follow its
              progress from confirmation to delivery.
            </p>

            <Link
              to={`/orders/${orderId}`}
              className="success-track-button"
            >
              TRACK MY ORDER →
            </Link>

          </div>
        )}


        {/* ACTIONS */}

        <div className="success-actions">

          <Link
            to="/shop"
            className="continue-shopping"
          >
            CONTINUE SHOPPING →
          </Link>

          <Link
            to="/my-orders"
            className="view-orders"
          >
            VIEW MY ORDERS
          </Link>

          <Link
            to="/"
            className="back-home"
          >
            ← BACK TO HOME
          </Link>

        </div>


        {/* FOOTNOTE */}

        <p className="success-note">
          Your order has been securely recorded in your
          Micky Mouse account.
        </p>

      </div>
    </main>
  );
}

export default OrderSuccess;