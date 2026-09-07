import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/useCart";

import API_URL from "../api/apiConfig";

import "./Checkout.css";

function Checkout() {
  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [rewardPoints, setRewardPoints] = useState(0);
  const [rewardPointsUsed, setRewardPointsUsed] = useState(0);
  const [rewardDiscount, setRewardDiscount] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(true);

  useEffect(() => {
  const fetchSavedAddresses = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/users/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch saved addresses"
        );
      }

      setSavedAddresses(data);

      // Automatically select the default address
      const defaultAddress = data.find(
        (address) => address.isDefault
      );

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      }
    } catch (error) {
      console.error("Saved addresses error:", error);
    } finally {
      setAddressLoading(false);
    }
  };

  fetchSavedAddresses();
}, []);

useEffect(() => {
  const fetchRewardPoints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/users/reward-points`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch reward points"
        );
      }

      setRewardPoints(data.rewardPoints || 0);
    } catch (error) {
      console.error("Reward points error:", error);
    } finally {
      setRewardLoading(false);
    }
  };

  fetchRewardPoints();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSavedAddressSelect = (address) => {
  setSelectedAddressId(address._id);

  const nameParts = address.fullName.trim().split(" ");

  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  setFormData((previous) => ({
    ...previous,
    firstName,
    lastName,
    phone: address.phone || "",
    address: address.address || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
  }));
};

const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError("Please enter a coupon code");
    return;
  }

  setCouponLoading(true);
  setCouponError("");

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/coupons/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: cartTotal,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to apply coupon"
      );
    }

    setAppliedCoupon(data.coupon);
    setCouponDiscount(data.discount);
    setCouponError("");
  } catch (error) {
    console.error("Coupon error:", error);

    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError(error.message);
  } finally {
    setCouponLoading(false);
  }
};

const handleRemoveCoupon = () => {
  setCouponCode("");
  setAppliedCoupon(null);
  setCouponDiscount(0);
  setCouponError("");
};

const handleRewardPointsChange = (e) => {
  const requestedPoints = Number(e.target.value) || 0;

  const amountAfterCoupon = Math.max(
    0,
    cartTotal - couponDiscount
  );

  const maximumUsablePoints = Math.min(
    rewardPoints,
    Math.floor(amountAfterCoupon)
  );

  const pointsToUse = Math.min(
    Math.max(0, requestedPoints),
    maximumUsablePoints
  );

  setRewardPointsUsed(pointsToUse);
  setRewardDiscount(pointsToUse);
};

const finalTotal = Math.max(
  0,
  cartTotal - couponDiscount - rewardDiscount
);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },

        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },

        items: cart.map((item) => ({
          productId: item._id || item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
        })),

        subtotal: cartTotal,

couponCode: appliedCoupon
  ? appliedCoupon.code
  : null,

  couponDiscount,

rewardPointsUsed,

rewardDiscount,


totalAmount: finalTotal,

paymentMethod: "online",
      };

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create order"
        );
      }

      console.log("Order created:", data);

      const orderId = data.order._id;

      const paymentResponse = await fetch(
        `${API_URL}/api/orders/${orderId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message ||
            "Failed to create payment"
        );
      }

      const options = {
        key: paymentData.keyId,

        amount: paymentData.razorpayOrder.amount,

        currency: paymentData.razorpayOrder.currency,

        name: "Micky Mouse",

        description: "Micky Mouse Store Purchase",

        order_id: paymentData.razorpayOrder.id,

        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },

        theme: {
          color: "#000000",
        },

        handler: async function (response) {
          try {
            console.log(
              "Payment response:",
              response
            );

            const verifyResponse = await fetch(
              `${API_URL}/api/orders/${orderId}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed"
              );
            }

            console.log(
              "Payment verified:",
              verifyData
            );

            clearCart();

            navigate("/order-success", {
              state: {
                order: verifyData.order,
                payment: response,
              },
            });
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(
              "Payment verification failed. Please contact support."
            );
          }
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Payment window closed"
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error(
        "Order error:",
        error
      );

      alert(
        "Failed to create order. Please try again."
      );
    }
  };

  if (cart.length === 0) {
    return (
      <main className="empty-checkout">

        <div className="empty-checkout-content">

          <span>CHECKOUT</span>

          <h1>Your Cart Is Empty</h1>

          <p>
            Add some products before proceeding
            to checkout.
          </p>

          <Link
            to="/shop"
            className="continue-shopping"
          >
            CONTINUE SHOPPING →
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="checkout-page">

      {/* HEADER */}

      <section className="checkout-header">

        <div>

          <p>
            MICKEY MOUSE • SECURE CHECKOUT
          </p>

          <h1>CHECKOUT</h1>

        </div>

        <span className="checkout-step">
          STEP 01 / 01
        </span>

      </section>


      <div className="checkout-container">

        {/* LEFT SIDE */}

        <section className="checkout-form">

          <div className="checkout-progress">

            <div className="progress-step active">
              <span>01</span>
              <p>DETAILS</p>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <span>02</span>
              <p>PAYMENT</p>
            </div>

          </div>


          <form onSubmit={handleSubmit}>

            {/* CUSTOMER */}

            <div className="checkout-section">

              <div className="checkout-section-title">

                <span>01</span>

                <div>
                  <p>YOUR DETAILS</p>
                  <h2>
                    CUSTOMER INFORMATION
                  </h2>
                </div>

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="firstName">
                    FIRST NAME
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="lastName">
                    LAST NAME
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="phone">
                  PHONE NUMBER
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* ADDRESS */}

            <div className="checkout-section">

              {/* SAVED ADDRESSES */}

{!addressLoading && savedAddresses.length > 0 && (
  <div className="saved-addresses-checkout">

    <div className="saved-addresses-checkout-heading">
      <span>SAVED ADDRESSES</span>
      <p>SELECT AN ADDRESS</p>
    </div>

    <div className="saved-addresses-checkout-list">

      {savedAddresses.map((address) => (

        <button
          type="button"
          key={address._id}
          className={`saved-address-checkout-card ${
            selectedAddressId === address._id
              ? "selected"
              : ""
          }`}
          onClick={() =>
            handleSavedAddressSelect(address)
          }
        >

          <div className="saved-address-checkout-top">

            <strong>
              {address.label}
            </strong>

            {address.isDefault && (
              <span>★ DEFAULT</span>
            )}

          </div>

          <p>
            {address.fullName}
          </p>

          <p>
            {address.address}
          </p>

          <p>
            {address.city}, {address.state}
          </p>

          <p>
            PIN: {address.pincode}
          </p>

          <span className="saved-address-select">
            {selectedAddressId === address._id
              ? "✓ SELECTED"
              : "USE THIS ADDRESS →"}
          </span>

        </button>

      ))}

    </div>

    <p className="saved-address-note">
      You can edit the selected address below before
      placing your order.
    </p>

  </div>
)}


              <div className="form-group">

                <label htmlFor="address">
                  FULL ADDRESS
                </label>

                <textarea
                  id="address"
                  name="address"
                  placeholder="House number, street, area..."
                  value={formData.address}
                  onChange={handleChange}
                  rows="4"
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="city">
                    CITY
                  </label>

                  <input
                    id="city"
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="state">
                    STATE
                  </label>

                  <input
                    id="state"
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label htmlFor="pincode">
                  PIN CODE
                </label>

                <input
                  id="pincode"
                  type="text"
                  name="pincode"
                  placeholder="6-digit PIN code"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />

              </div>

            </div>


            {/* PAYMENT */}

            <div className="checkout-section">

              <div className="checkout-section-title">

                <span>03</span>

                <div>
                  <p>ALMOST THERE</p>
                  <h2>PAYMENT</h2>
                </div>

              </div>


              <div className="payment-option">

                <input
                  type="radio"
                  id="online"
                  name="payment"
                  value="online"
                  defaultChecked
                />

                <label htmlFor="online">

                  <span className="payment-radio">
                    ✓
                  </span>

                  <span>
                    <strong>
                      ONLINE PAYMENT
                    </strong>

                    <small>
                      Secure payment powered by Razorpay
                    </small>
                  </span>

                </label>

              </div>


              <p className="payment-note">
                You will be redirected to the secure
                Razorpay payment window after placing
                your order.
              </p>

            </div>


            <button
  type="submit"
  className="place-order-button"
>
  <span>CONTINUE TO SECURE PAYMENT</span>
  <span className="payment-arrow">→</span>
</button>

          </form>

        </section>


        {/* RIGHT SIDE */}

        <aside className="checkout-summary">

          <div className="checkout-summary-heading">

            <p>YOUR SELECTION</p>

            <h2>ORDER SUMMARY</h2>

          </div>


          <div className="checkout-products">

            {cart.map((item) => (

              <div
                className="checkout-product"
                key={`${item.id}-${item.size}`}
              >

                <div className="checkout-product-image">

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <span>
                    ×{item.quantity}
                  </span>

                </div>


                <div className="checkout-product-info">

                  <h3>{item.name}</h3>

                  <p>
                    {item.size} • {item.category || "COLLECTION"}
                  </p>

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
          {/* COUPON */}

<div className="checkout-coupon">
  <div className="checkout-coupon-heading">
    <span>HAVE A COUPON?</span>
    <p>APPLY YOUR DISCOUNT</p>
  </div>

  {!appliedCoupon ? (
    <>
      <div className="coupon-input-row">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) =>
            setCouponCode(e.target.value.toUpperCase())
          }
        />

        <button
          type="button"
          onClick={handleApplyCoupon}
          disabled={couponLoading}
        >
          {couponLoading ? "CHECKING..." : "APPLY"}
        </button>
      </div>

      {couponError && (
        <p className="coupon-error">
          {couponError}
        </p>
      )}
    </>
  ) : (
    <div className="applied-coupon">
      <div>
        <strong>{appliedCoupon.code}</strong>

        <span>
          {appliedCoupon.discountType === "percentage"
            ? `${appliedCoupon.discountValue}% OFF`
            : `₹${appliedCoupon.discountValue} OFF`}
        </span>
      </div>

      <button
        type="button"
        onClick={handleRemoveCoupon}
      >
        REMOVE
      </button>
    </div>
  )}
</div>

{couponDiscount > 0 && (
  <div className="summary-row coupon-discount-row">
    <span>Coupon Discount</span>

    <span>
      -₹{couponDiscount.toLocaleString("en-IN")}
    </span>
  </div>
)}
{rewardDiscount > 0 && (
  <div className="summary-row reward-discount-row">
    <span>Reward Points</span>

    <span>
      -₹{rewardDiscount.toLocaleString("en-IN")}
    </span>
  </div>
)}

{/* REWARD POINTS */}

<div className="checkout-rewards">
  <div className="checkout-rewards-heading">
    <span>REWARD POINTS</span>
    <p>USE YOUR POINTS TO SAVE MORE</p>
  </div>

  {rewardLoading ? (
    <p>Loading reward points...</p>
  ) : rewardPoints > 0 ? (
    <>
      <div className="reward-balance">
        <strong>{rewardPoints}</strong>
        <span>points available</span>
      </div>

      <div className="reward-input-row">
        <input
          type="number"
          min="0"
          max={rewardPoints}
          value={rewardPointsUsed}
          onChange={handleRewardPointsChange}
          placeholder="Points to use"
        />

        <span>1 point = ₹1</span>
      </div>

      {rewardDiscount > 0 && (
        <p className="reward-applied">
          ✓ ₹{rewardDiscount.toLocaleString("en-IN")} reward
          discount applied
        </p>
      )}
    </>
  ) : (
    <p className="no-rewards">
      You don't have any reward points yet.
    </p>
  )}
</div>


          <div className="summary-divider"></div>


          <div className="summary-row">

            <span>Subtotal</span>

            <span>
              ₹{cartTotal.toLocaleString("en-IN")}
            </span>

          </div>


          <div className="summary-row">

            <span>Shipping</span>

            <span>FREE</span>

          </div>


          <div className="summary-divider"></div>


<div className="summary-total">
  <span>TOTAL</span>

  <strong>
    ₹{finalTotal.toLocaleString("en-IN")}
  </strong>
</div>


          <div className="secure-note">
            🔒 Your payment is securely processed
            through Razorpay.
          </div>


          <button
            className="back-to-cart"
            onClick={() => navigate("/cart")}
          >
            ← BACK TO CART
          </button>

        </aside>

      </div>

    </main>
  );
}

export default Checkout;