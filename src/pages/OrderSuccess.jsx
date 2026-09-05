import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  const order = location.state?.order;
  const payment = location.state?.payment;

  return (
    <main className="order-success-page">

      <div className="order-success-container">

        {/* SUCCESS ICON */}

        <div className="success-icon">
          ✓
        </div>


        {/* HEADER */}

        <p className="success-label">
          MICKEY MOUSE • ORDER CONFIRMED
        </p>

        <h1>
          THANK YOU.
        </h1>

        <p className="success-message">
          Your order has been successfully placed
          and your payment has been confirmed.
        </p>


        {/* ORDER INFORMATION */}

        {order?._id && (
          <div className="success-order-card">

            <div className="success-card-heading">
              <span>ORDER DETAILS</span>
              <span>✓ PAID</span>
            </div>


            <div className="success-order-info">

              <div>
                <span>ORDER ID</span>
                <strong>{order._id}</strong>
              </div>

              {payment?.razorpay_payment_id && (
                <div>
                  <span>PAYMENT ID</span>
                  <strong>
                    {payment.razorpay_payment_id}
                  </strong>
                </div>
              )}

              <div>
                <span>ORDER STATUS</span>
                <strong>
                  {order.orderStatus || "CONFIRMED"}
                </strong>
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

          </div>
        )}


        {/* DELIVERY */}

        {order?.shippingAddress && (
          <div className="success-delivery">

            <div>
              <span className="success-section-label">
                DELIVERY ADDRESS
              </span>

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
          A confirmation of your order has been
          recorded in your Micky Mouse account.
        </p>

      </div>

    </main>
  );
}

export default OrderSuccess;