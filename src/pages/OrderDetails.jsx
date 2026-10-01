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

  // ==========================================
  // RETURN STATES
  // ==========================================

  const [returnItem, setReturnItem] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState("");

  // ==========================================
  // FETCH ORDER
  // ==========================================

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token =
          localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/orders/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch order"
          );
        }

        setOrder(data);
      } catch (error) {
        console.error(
          "Order details error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this order?"
        );

      if (!confirmed) return;

      try {
        setCancelling(true);
        setCancelError("");

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await fetch(
            `${API_URL}/api/orders/${id}/cancel`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to cancel order"
          );
        }

        setOrder(data.order);

        alert(
          "Order cancelled successfully."
        );
      } catch (error) {
        console.error(
          "Cancel order error:",
          error
        );

        setCancelError(
          error.message
        );
      } finally {
        setCancelling(false);
      }
    };

  // ==========================================
  // OPEN RETURN MODAL
  // ==========================================

  const openReturnModal = (item) => {
    setReturnItem(item);
    setReturnReason("");
    setReturnComment("");
    setReturnError("");
  };

  // ==========================================
  // CLOSE RETURN MODAL
  // ==========================================

  const closeReturnModal = () => {
    if (returning) return;

    setReturnItem(null);
    setReturnReason("");
    setReturnComment("");
    setReturnError("");
  };

  // ==========================================
  // SUBMIT RETURN
  // ==========================================

  const handleReturnSubmit =
    async () => {
      if (!returnItem) return;

      if (!returnReason) {
        setReturnError(
          "Please select a return reason."
        );
        return;
      }

      try {
        setReturning(true);
        setReturnError("");

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await fetch(
            `${API_URL}/api/orders/${id}/items/${returnItem._id}/return`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                reason:
                  returnReason,

                comment:
                  returnComment,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to submit return request"
          );
        }

        setOrder(data.order);

        closeReturnModal();

        alert(
          "Return request submitted successfully."
        );
      } catch (error) {
        console.error(
          "Return request error:",
          error
        );

        setReturnError(
          error.message
        );
      } finally {
        setReturning(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-loading">
          <span>
            SPACE WEAR • ORDER
          </span>

          <h1>
            Loading Order...
          </h1>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <main className="order-details-page">
        <div className="order-details-error">

          <span>
            ORDER • ERROR
          </span>

          <h1>
            Unable to Load Order
          </h1>

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

  // ==========================================
  // DATE / TIME
  // ==========================================

  const orderDate =
    new Date(
      order.createdAt
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

  const orderTime =
    new Date(
      order.createdAt
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  return (
    <main className="order-details-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <section className="order-details-header">

        <div className="order-details-header-content">

          <Link
            to="/my-orders"
            className="order-details-back"
          >
            ← MY ORDERS
          </Link>

          <p>
            SPACE WEAR • ORDER CONFIRMATION
          </p>

          <h1>
            ORDER
            <br />
            DETAILS.
          </h1>

          <span>
            Complete information about
            your purchase, payment and
            delivery.
          </span>

        </div>

        <div className="order-details-header-mark">
          <span>SW</span>
        </div>

      </section>


      {/* ==========================================
          CONTENT
      ========================================== */}

      <section className="order-details-content">

        {/* ORDER OVERVIEW */}

        <div className="order-overview">

          <div>
            <span>ORDER ID</span>

            <strong>
              #
              {order._id
                .slice(-8)
                .toUpperCase()}
            </strong>
          </div>

          <div>
            <span>DATE</span>

            <strong>
              {orderDate}
            </strong>
          </div>

          <div>
            <span>TIME</span>

            <strong>
              {orderTime}
            </strong>
          </div>

          <div>
            <span>TOTAL</span>

            <strong>
              ₹
              {Number(
                order.totalAmount || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>


        {/* ==========================================
            ORDER STATUS
        ========================================== */}

        <div className="order-status-panel">

          <div className="order-status-heading">

            <div>
              <span>
                ORDER PROGRESS
              </span>

              <h2>
                YOUR ORDER STATUS
              </h2>
            </div>

            <span
              className={`details-status-badge delivery-${order.orderStatus}`}
            >
              {order.orderStatus}
            </span>

          </div>


          {order.orderStatus ===
          "cancelled" ? (

            <div className="order-cancelled-status">

              <div className="cancelled-icon">
                ×
              </div>

              <div>

                <strong>
                  ORDER CANCELLED
                </strong>

                <p>
                  This order has been
                  cancelled and will not
                  be processed.
                </p>

              </div>

            </div>

          ) : (

            <div className="order-progress">

              {[
                "confirmed",
                "processing",
                "shipped",
                "delivered",
              ].map(
                (
                  status,
                  index
                ) => {

                  const statusOrder = [
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                  ];

                  const currentIndex =
                    statusOrder.indexOf(
                      order.orderStatus
                    );

                  const thisIndex =
                    index;

                  const completed =
                    currentIndex >=
                    thisIndex;

                  const current =
                    currentIndex ===
                    thisIndex;

                  return (
                    <div
                      key={status}
                      className={`progress-step ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        current
                          ? "current"
                          : ""
                      }`}
                    >
                      <span>
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <strong>
                        {status.toUpperCase()}
                      </strong>
                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>


        {/* ==========================================
            DELIVERY STATUS
        ========================================== */}

        <div className="delivery-status-panel">

          <div className="order-status-heading">

            <div>

              <span>
                DELIVERY INFORMATION
              </span>

              <h2>
                DELIVERY STATUS
              </h2>

            </div>

            <span
              className={`details-status-badge delivery-${
                order.orderStatus ===
                "delivered"
                  ? "delivered"
                  : order.deliveryStatus ||
                    "pending"
              }`}
            >
              {(
                order.orderStatus ===
                "delivered"
                  ? "delivered"
                  : order.deliveryStatus ||
                    "pending"
              )
                .replaceAll(
                  "_",
                  " "
                )
                .toUpperCase()}
            </span>

          </div>


          <div className="delivery-status-content">

            <div className="delivery-status-icon">
              🚚
            </div>

            <div className="delivery-status-info">

              <strong>

                {order.orderStatus ===
                "delivered"
                  ? "Order Delivered"
                  : order.deliveryStatus ===
                    "assigned"
                  ? "Delivery Assigned"
                  : order.deliveryStatus ===
                    "picked_up"
                  ? "Order Picked Up"
                  : order.deliveryStatus ===
                    "in_transit"
                  ? "Order In Transit"
                  : order.deliveryStatus ===
                    "out_for_delivery"
                  ? "Out for Delivery"
                  : order.deliveryStatus ===
                    "cancelled"
                  ? "Delivery Cancelled"
                  : "Delivery Pending"}

              </strong>

              <p>

                {order.orderStatus ===
                "delivered"
                  ? "Your order has been successfully delivered."
                  : order.deliveryStatus ===
                    "assigned"
                  ? "A delivery person has been assigned to your order."
                  : order.deliveryStatus ===
                    "picked_up"
                  ? "Your order has been picked up for delivery."
                  : order.deliveryStatus ===
                    "in_transit"
                  ? "Your order is currently on the way."
                  : order.deliveryStatus ===
                    "out_for_delivery"
                  ? "Your order is out for delivery and will arrive soon."
                  : order.deliveryStatus ===
                    "cancelled"
                  ? "The delivery for this order has been cancelled."
                  : "Your order is waiting for delivery processing."}

              </p>

              {order.deliveryMethod && (
                <p>
                  DELIVERY METHOD:{" "}
                  <strong>
                    {order.deliveryMethod ===
                    "courier"
                      ? "COURIER"
                      : "OWN DELIVERY"}
                  </strong>
                </p>
              )}

              {order.shippingProvider && (
                <p>
                  SHIPPING PROVIDER:{" "}
                  <strong>
                    {order.shippingProvider}
                  </strong>
                </p>
              )}

              {order.trackingId && (
                <p>
                  TRACKING ID:{" "}
                  <strong>
                    {order.trackingId}
                  </strong>
                </p>
              )}

            </div>

          </div>

        </div>


        {/* ==========================================
            MAIN GRID
        ========================================== */}

        <div className="order-details-grid">

          {/* PRODUCTS */}

          <section className="order-products-section">

            <div className="order-section-heading">

              <div>

                <span>
                  YOUR PURCHASE
                </span>

                <h2>
                  ORDERED ITEMS
                </h2>

              </div>

              <span>
                {order.items.length}{" "}
                {order.items.length === 1
                  ? "ITEM"
                  : "ITEMS"}
              </span>

            </div>


            <div className="order-detail-items">

              {order.items.map(
                (item) => {

                  const canReturn =
                    order.orderStatus ===
                      "delivered" &&
                    (!item.returnStatus ||
                      item.returnStatus ===
                        "not_requested");

                  return (

                    <div
                      className="order-detail-item"
                      key={item._id}
                    >

                      {/* IMAGE */}

                      <div className="order-detail-image">

                        {item.image ? (

                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name ||
                              "Product"
                            }
                          />

                        ) : item.productId?.image ? (

                          <img
                            src={
                              item.productId
                                .image
                            }
                            alt={
                              item.productId
                                ?.name ||
                              "Product"
                            }
                          />

                        ) : (

                          <span>
                            MM
                          </span>

                        )}

                      </div>


                      {/* PRODUCT INFO */}

                      <div className="order-detail-product-info">

                        <span>
                          {item.productId
                            ?.category ||
                            "MICKEY MOUSE"}
                        </span>

                        <h3>
                          {item.name ||
                            item.productId
                              ?.name ||
                            "Product"}
                        </h3>

                        {item.size && (
                          <p>
                            SIZE:{" "}
                            <strong>
                              {item.size}
                            </strong>
                          </p>
                        )}

                        <p>
                          QUANTITY:{" "}
                          <strong>
                            {item.quantity}
                          </strong>
                        </p>


                        {/* RETURN STATUS */}

                        {item.returnStatus &&
                          item.returnStatus !==
                            "not_requested" && (

                            <p
                              className={`return-status return-${item.returnStatus}`}
                            >
                              RETURN:{" "}
                              {item.returnStatus
                                .replaceAll(
                                  "_",
                                  " "
                                )
                                .toUpperCase()}
                            </p>

                          )}

                      </div>


                      {/* PRICE + RETURN */}

                      <div className="order-detail-item-price">

                        <span>
                          ₹
                          {Number(
                            item.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}{" "}
                          / ITEM
                        </span>

                        <strong>
                          ₹
                          {(
                            Number(
                              item.price ||
                                0
                            ) *
                            Number(
                              item.quantity ||
                                0
                            )
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>


                        {canReturn && (

                          <button
                            type="button"
                            className="return-item-button"
                            onClick={() =>
                              openReturnModal(
                                item
                              )
                            }
                          >
                            RETURN ITEM
                          </button>

                        )}

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          </section>


          {/* ==========================================
              SUMMARY
          ========================================== */}

          <aside className="order-summary-section">

            <span className="order-summary-label">
              PAYMENT
            </span>

            <h2>
              ORDER SUMMARY
            </h2>

            <div className="order-summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {Number(
                  order.subtotal ||
                    order.totalAmount ||
                    0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            <div className="order-summary-row">

              <span>
                Shipping
              </span>

              <strong>
                ₹
                {Number(
                  order.deliveryCharge ||
                    0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {Number(
              order.couponDiscount ||
                0
            ) > 0 && (

              <div className="order-summary-row">

                <span>
                  Coupon Discount
                </span>

                <strong>
                  − ₹
                  {Number(
                    order.couponDiscount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            )}

            {Number(
              order.rewardDiscount ||
                0
            ) > 0 && (

              <div className="order-summary-row">

                <span>
                  Reward Discount
                </span>

                <strong>
                  − ₹
                  {Number(
                    order.rewardDiscount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            )}

            <div className="order-summary-divider"></div>

            <div className="order-summary-total">

              <span>
                TOTAL
              </span>

              <strong>
                ₹
                {Number(
                  order.totalAmount ||
                    0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <div className="payment-status-box">

              <span>
                PAYMENT STATUS
              </span>

              <strong
                className={
                  order.paymentStatus ===
                  "paid"
                    ? "payment-paid"
                    : "payment-unpaid"
                }
              >
                {order.paymentStatus ===
                "paid"
                  ? "✓ PAYMENT CONFIRMED"
                  : order.paymentStatus}
              </strong>

            </div>

          </aside>


          {/* SHIPPING */}

          <section className="shipping-details-section">

            <div className="order-section-heading">

              <div>

                <span>
                  DELIVERY INFORMATION
                </span>

                <h2>
                  SHIPPING ADDRESS
                </h2>

              </div>

              <span>
                01
              </span>

            </div>


            <div className="shipping-address">

              <strong>
                {order.shippingAddress
                  ?.name ||
                  order.userId
                    ?.name ||
                  "Customer"}
              </strong>

              <p>

                {order.shippingAddress
                  ?.address}

                <br />

                {order.shippingAddress
                  ?.city}
                ,{" "}
                {order.shippingAddress
                  ?.state}

                <br />

                PIN:{" "}
                {order.shippingAddress
                  ?.pincode}

              </p>

            </div>

          </section>

        </div>


        {/* ==========================================
            FOOTER ACTIONS
        ========================================== */}

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

          {[
            "pending",
            "confirmed",
            "processing",
          ].includes(
            order.orderStatus
          ) && (

            <button
              type="button"
              className="cancel-order-button"
              onClick={
                handleCancelOrder
              }
              disabled={
                cancelling
              }
            >
              {cancelling
                ? "CANCELLING..."
                : "CANCEL ORDER"}
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


      {/* ==========================================
          RETURN MODAL
      ========================================== */}

      {returnItem && (

        <div
          className="return-modal-overlay"
          onClick={
            closeReturnModal
          }
        >

          <div
            className="return-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="return-modal-close"
              onClick={
                closeReturnModal
              }
            >
              ×
            </button>


            <span className="return-modal-label">
              RETURN REQUEST
            </span>

            <h2>
              Return{" "}
              {returnItem.name}
            </h2>

            <p>
              Please select the reason
              for returning this item.
            </p>


            <label>
              RETURN REASON
            </label>

            <select
              value={
                returnReason
              }
              onChange={(e) =>
                setReturnReason(
                  e.target.value
                )
              }
            >

              <option value="">
                Select a reason
              </option>

              <option value="wrong_size">
                Wrong size
              </option>

              <option value="wrong_product">
                Wrong product received
              </option>

              <option value="damaged">
                Product damaged
              </option>

              <option value="defective">
                Product defective
              </option>

              <option value="not_as_expected">
                Not as expected
              </option>

              <option value="changed_mind">
                Changed my mind
              </option>

              <option value="other">
                Other
              </option>

            </select>


            <label>
              ADDITIONAL COMMENTS
            </label>

            <textarea
              value={
                returnComment
              }
              onChange={(e) =>
                setReturnComment(
                  e.target.value
                )
              }
              placeholder="Tell us more about the return..."
              rows="4"
            />


            {returnError && (

              <p className="return-modal-error">
                {returnError}
              </p>

            )}


            <div className="return-modal-actions">

              <button
                type="button"
                className="return-modal-cancel"
                onClick={
                  closeReturnModal
                }
                disabled={
                  returning
                }
              >
                CANCEL
              </button>

              <button
                type="button"
                className="return-modal-submit"
                onClick={
                  handleReturnSubmit
                }
                disabled={
                  returning
                }
              >
                {returning
                  ? "SUBMITTING..."
                  : "SUBMIT RETURN REQUEST →"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

export default OrderDetails;