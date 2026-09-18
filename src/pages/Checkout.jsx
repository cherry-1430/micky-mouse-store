import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  useCart,
} from "../context/useCart";

import {
  useAuth,
} from "../context/AuthContext";

import API_URL from "../api/apiConfig";

import "./Checkout.css";

function Checkout() {
  const {
    cart,
    clearCart,
  } = useCart();

  const { isLoggedIn } = useAuth();

  const navigate = useNavigate();

  // =========================================================
  // CUSTOMER FORM
  // =========================================================

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

  // =========================================================
  // CHECKOUT CART
  // =========================================================

  const [checkoutCart, setCheckoutCart] = useState([]);

  const [priceLoading, setPriceLoading] =
    useState(true);

  const [priceError, setPriceError] =
    useState("");

  const [priceChanged, setPriceChanged] =
    useState(false);

  // =========================================================
  // SAVED ADDRESSES
  // =========================================================

  const [savedAddresses, setSavedAddresses] =
    useState([]);

  const [addressLoading, setAddressLoading] =
    useState(true);

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  // =========================================================
  // COUPON
  // =========================================================

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState("");

  // =========================================================
  // REWARD POINTS
  // =========================================================

  const [rewardPoints, setRewardPoints] =
    useState(0);

  const [rewardPointsUsed, setRewardPointsUsed] =
    useState(0);

  const [rewardDiscount, setRewardDiscount] =
    useState(0);

  const [rewardLoading, setRewardLoading] =
    useState(true);

  // =========================================================
  // OTP ERROR
  // =========================================================

  const [otpError, setOtpError] =
    useState("");

  // =========================================================
  // LOGIN CHECK
  // =========================================================

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [isLoggedIn, navigate]);

  // =========================================================
  // EFFECTIVE PRICE
  // =========================================================

  const getEffectivePrice = (product) => {
    let price = Number(
      product.price || 0
    );

    if (
      product.isFlashSale &&
      Number(product.salePrice || 0) > 0
    ) {
      const now = new Date();

      const saleStart = product.saleStart
        ? new Date(product.saleStart)
        : null;

      const saleEnd = product.saleEnd
        ? new Date(product.saleEnd)
        : null;

      const saleActive =
        (!saleStart ||
          now >= saleStart) &&
        (!saleEnd ||
          now <= saleEnd);

      if (saleActive) {
        price = Number(
          product.salePrice
        );
      }
    }

    return price;
  };

  // =========================================================
  // FETCH LATEST PRODUCTS
  // =========================================================

  const fetchLatestProducts = async () => {
    if (!cart || cart.length === 0) {
      setCheckoutCart([]);
      setPriceLoading(false);
      return;
    }

    try {
      setPriceLoading(true);
      setPriceError("");

      const response = await fetch(
        `${API_URL}/api/products`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch latest products"
        );
      }

      const products = Array.isArray(data)
        ? data
        : data.products || [];

      let hasPriceChanged = false;

      const updatedCart = cart.map(
        (cartItem) => {
          const product =
            products.find(
              (product) =>
                String(product._id) ===
                String(cartItem.id)
            );

          if (!product) {
            return {
              ...cartItem,
              unavailable: true,
              stock: 0,
            };
          }

          const latestPrice =
            getEffectivePrice(product);

          const oldPrice =
            Number(
              cartItem.price || 0
            );

          if (
            oldPrice !==
            latestPrice
          ) {
            hasPriceChanged = true;
          }

          return {
            ...cartItem,

            price:
              latestPrice,

            originalPrice:
              Number(
                product.price || 0
              ),

            salePrice:
              Number(
                product.salePrice || 0
              ),

            saleStart:
              product.saleStart ||
              null,

            saleEnd:
              product.saleEnd ||
              null,

            isFlashSale:
              product.isFlashSale ||
              false,

            stock:
              Number(
                product.stock || 0
              ),

            name:
              product.name,

            image:
              product.image,

            category:
              product.category,

            unavailable:
              false,
          };
        }
      );

      setCheckoutCart(
        updatedCart
      );

      setPriceChanged(
        hasPriceChanged
      );

      if (hasPriceChanged) {
        setAppliedCoupon(null);
        setCouponDiscount(0);

        setCouponError(
          "Product price changed. Please apply your coupon again."
        );
      }

      // =====================================================
      // SAVE UPDATED CART
      // =====================================================

      const cartForStorage =
        updatedCart.map(
          (item) => {
            const {
              stock,
              unavailable,
              ...cartItem
            } = item;

            return cartItem;
          }
        );

      localStorage.setItem(
        "mickyMouseCart",
        JSON.stringify(
          cartForStorage
        )
      );
    } catch (error) {
      console.error(
        "Latest products error:",
        error
      );

      setPriceError(
        "Unable to check latest product prices."
      );

      setCheckoutCart(cart);
    } finally {
      setPriceLoading(false);
    }
  };

  // =========================================================
  // INITIAL PRICE CHECK
  // =========================================================

  useEffect(() => {
    fetchLatestProducts();

    const interval =
      setInterval(() => {
        fetchLatestProducts();
      }, 30000);

    return () =>
      clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // =========================================================
  // SAVED ADDRESSES
  // =========================================================

  useEffect(() => {
    const fetchSavedAddresses =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            setAddressLoading(false);
            return;
          }

          const response =
            await fetch(
              `${API_URL}/api/users/addresses`,
              {
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
                "Failed to fetch saved addresses"
            );
          }

          setSavedAddresses(data);

          const defaultAddress =
            data.find(
              (address) =>
                address.isDefault
            );

          if (defaultAddress) {
            setSelectedAddressId(
              defaultAddress._id
            );
          }
        } catch (error) {
          console.error(
            "Saved addresses error:",
            error
          );
        } finally {
          setAddressLoading(
            false
          );
        }
      };

    fetchSavedAddresses();
  }, []);

  // =========================================================
  // REWARD POINTS
  // =========================================================

  useEffect(() => {
    const fetchRewardPoints =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            setRewardLoading(false);
            return;
          }

          const response =
            await fetch(
              `${API_URL}/api/users/reward-points`,
              {
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
                "Failed to fetch reward points"
            );
          }

          setRewardPoints(
            Number(
              data.rewardPoints || 0
            )
          );
        } catch (error) {
          console.error(
            "Reward points error:",
            error
          );
        } finally {
          setRewardLoading(
            false
          );
        }
      };

    fetchRewardPoints();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    if (name === "phone") {
      setOtpError("");
    }
  };

  // =========================================================
  // SAVED ADDRESS SELECT
  // =========================================================

  const handleSavedAddressSelect =
    (address) => {
      setSelectedAddressId(
        address._id
      );

      const nameParts =
        address.fullName
          .trim()
          .split(" ");

      const firstName =
        nameParts[0] || "";

      const lastName =
        nameParts
          .slice(1)
          .join(" ");

      setFormData(
        (previous) => ({
          ...previous,

          firstName,

          lastName,

          phone:
            address.phone || "",

          address:
            address.address || "",

          city:
            address.city || "",

          state:
            address.state || "",

          pincode:
            address.pincode || "",
        })
      );
    };

  // =========================================================
  // CHECKOUT CART TOTAL
  // IMPORTANT:
  // USE THIS TOTAL THROUGHOUT CHECKOUT
  // =========================================================

const checkoutCartTotal = checkoutCart.reduce(
  (total, item) =>
    total +
    Number(item.price || 0) *
      Number(item.quantity || 0),
  0
);

  // =========================================================
  // COUPON
  // =========================================================

  const handleApplyCoupon =
    async () => {
      if (!couponCode.trim()) {
        setCouponError(
          "Please enter a coupon code"
        );
        return;
      }

      setCouponLoading(true);
      setCouponError("");

      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const headers = {
          "Content-Type":
            "application/json",
        };

        if (token) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        const response =
          await fetch(
            `${API_URL}/api/coupons/validate`,
            {
              method: "POST",

              headers,

              body:
                JSON.stringify({
                  code:
                    couponCode.trim(),

                  orderAmount:
                    checkoutCartTotal,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to apply coupon"
          );
        }

        setAppliedCoupon(
          data.coupon
        );

        setCouponDiscount(
          Number(
            data.discount || 0
          )
        );

        setCouponError("");
      } catch (error) {
        console.error(
          "Coupon error:",
          error
        );

        setAppliedCoupon(null);

        setCouponDiscount(0);

        setCouponError(
          error.message
        );
      } finally {
        setCouponLoading(
          false
        );
      }
    };

  // =========================================================
  // REMOVE COUPON
  // =========================================================

  const handleRemoveCoupon =
    () => {
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError("");
    };

  // =========================================================
  // REWARD POINTS
  // =========================================================

  const handleRewardPointsChange =
    (e) => {
      const requestedPoints =
        Number(
          e.target.value
        ) || 0;

      const amountAfterCoupon =
        Math.max(
          0,
          checkoutCartTotal -
            couponDiscount
        );

      const maximumUsablePoints =
        Math.min(
          rewardPoints,
          Math.floor(
            amountAfterCoupon
          )
        );

      const pointsToUse =
        Math.min(
          Math.max(
            0,
            requestedPoints
          ),
          maximumUsablePoints
        );

      setRewardPointsUsed(
        pointsToUse
      );

      setRewardDiscount(
        pointsToUse
      );
    };

  // =========================================================
  // DELIVERY CHARGE
  //
  // BELOW ₹999  -> ₹100
  // ₹999 OR MORE -> FREE
  // =========================================================

  const deliveryCharge =
    checkoutCartTotal < 999
      ? 100
      : 0;

  // =========================================================
  // FINAL TOTAL
  //
  // FIX:
  // DO NOT USE cartTotal HERE.
  // USE checkoutCartTotal.
  // =========================================================

 const finalTotal = Math.max(
  0,
  checkoutCartTotal -
    couponDiscount -
    rewardDiscount +
    deliveryCharge
);

  // =========================================================
  // STOCK VALIDATION
  // =========================================================

  const validateStock = (
    items = checkoutCart
  ) => {
    return items.filter(
      (item) =>
        item.unavailable ||
        Number(
          item.stock || 0
        ) <
          Number(
            item.quantity || 0
          )
    );
  };

  // =========================================================
  // SUBMIT ORDER
  // =========================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  // =========================================================
  // TOKEN
  // =========================================================

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login before placing the order.");
    navigate("/login");
    return;
  }

  // =========================================================
  // PHONE VALIDATION
  // =========================================================

  const phone = String(formData.phone || "")
    .replace(/\D/g, "");

  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  // =========================================================
  // PRICE CHECK
  // =========================================================

  if (priceLoading) {
    alert(
      "Please wait while we check the latest product prices."
    );
    return;
  }

  if (!checkoutCart || checkoutCart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  // =========================================================
  // STOCK VALIDATION
  // =========================================================

  const outOfStockItems = validateStock(checkoutCart);

  if (outOfStockItems.length > 0) {
    alert(
      `Insufficient stock for: ${outOfStockItems
        .map((item) => item.name)
        .join(", ")}`
    );

    return;
  }

  // =========================================================
  // CALCULATE VALUES AGAIN
  // IMPORTANT:
  // Do NOT depend on old cartTotal.
  // =========================================================

  const subtotal = Number(
    checkoutCart
      .reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      )
      .toFixed(2)
  );

  // Delivery is based on subtotal BEFORE discounts.
  const delivery = subtotal < 999 ? 100 : 0;

  const coupon = Number(
    couponDiscount || 0
  );

  const reward = Number(
    rewardDiscount || 0
  );

  const calculatedFinalTotal = Number(
    Math.max(
      0,
      subtotal -
        coupon -
        reward +
        delivery
    ).toFixed(2)
  );

  // =========================================================
  // DEBUG
  // =========================================================

  console.log("========== CHECKOUT CALCULATION ==========");
  console.log("Subtotal:", subtotal);
  console.log("Coupon Discount:", coupon);
  console.log("Reward Discount:", reward);
  console.log("Delivery Charge:", delivery);
  console.log("FINAL TOTAL:", calculatedFinalTotal);
  console.log("==========================================");

  // =========================================================
  // BUILD ORDER DATA
  // =========================================================

  const orderData = {
    customer: {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: phone,
    },

    shippingAddress: {
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
    },

    items: checkoutCart.map((item) => ({
      productId: item.id,

      name: item.name,

      price: Number(item.price || 0),

      image: item.image,

      size: item.size,

      quantity: Number(item.quantity || 1),
    })),

    subtotal: subtotal,

    couponCode: appliedCoupon
      ? appliedCoupon.code
      : null,

    couponDiscount: coupon,

    rewardPointsUsed: Number(
      rewardPointsUsed || 0
    ),

    rewardDiscount: reward,

    deliveryCharge: delivery,

    totalAmount: calculatedFinalTotal,

    paymentMethod: "online",
  };

  console.log(
    "========== ORDER DATA =========="
  );

  console.log(orderData);

  console.log(
    "Backend should receive deliveryCharge:",
    orderData.deliveryCharge
  );

  console.log(
    "Backend should receive totalAmount:",
    orderData.totalAmount
  );

  console.log(
    "================================"
  );

  try {
    // =======================================================
    // CREATE DATABASE ORDER
    // =======================================================

    const response = await fetch(
      `${API_URL}/api/orders`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(orderData),
      }
    );

    const data = await response.json();

    console.log(
      "CREATE ORDER RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to create order"
      );
    }

    if (!data.order || !data.order._id) {
      throw new Error(
        "Order was created but order ID was not returned."
      );
    }

    const orderId = data.order._id;

    // =======================================================
    // CHECK BACKEND CALCULATED VALUES
    // =======================================================

    console.log(
      "========== DATABASE ORDER =========="
    );

    console.log(
      "Database subtotal:",
      data.order.subtotal
    );

    console.log(
      "Database delivery charge:",
      data.order.deliveryCharge
    );

    console.log(
      "Database coupon discount:",
      data.order.couponDiscount
    );

    console.log(
      "Database reward discount:",
      data.order.rewardDiscount
    );

    console.log(
      "Database total amount:",
      data.order.totalAmount
    );

    console.log(
      "===================================="
    );

    // =======================================================
    // CREATE RAZORPAY ORDER
    // =======================================================

    const paymentResponse = await fetch(
      `${API_URL}/api/orders/${orderId}/payment`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const paymentData =
      await paymentResponse.json();

    console.log(
      "RAZORPAY ORDER RESPONSE:",
      paymentData
    );

    if (!paymentResponse.ok) {
      throw new Error(
        paymentData.message ||
          "Failed to create Razorpay payment"
      );
    }

    if (
      !paymentData.razorpayOrder ||
      !paymentData.razorpayOrder.id
    ) {
      throw new Error(
        "Razorpay order ID was not returned."
      );
    }

    // =======================================================
    // RAZORPAY SCRIPT CHECK
    // =======================================================

    if (!window.Razorpay) {
      throw new Error(
        "Razorpay is not loaded. Please refresh the page."
      );
    }

    // =======================================================
    // RAZORPAY OPTIONS
    // =======================================================

    const options = {
      key: paymentData.keyId,

      amount:
        paymentData.razorpayOrder.amount,

      currency:
        paymentData.razorpayOrder.currency,

      name: "Micky Mouse",

      description:
        "Micky Mouse Store Purchase",

      order_id:
        paymentData.razorpayOrder.id,

      prefill: {
        name:
          `${formData.firstName} ${formData.lastName}`.trim(),

        email:
          formData.email.trim(),

        contact:
          phone,
      },

      theme: {
        color: "#000000",
      },

      // =====================================================
      // PAYMENT SUCCESS
      // =====================================================

      handler: async function (
        razorpayResponse
      ) {
        try {
          console.log(
            "========== RAZORPAY PAYMENT =========="
          );

          console.log(
            razorpayResponse
          );

          // =================================================
          // VERIFY PAYMENT
          // =================================================

          const verifyResponse =
            await fetch(
              `${API_URL}/api/orders/${orderId}/verify-payment`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${localStorage.getItem(
                      "token"
                    )}`,
                },

                body: JSON.stringify({
                  razorpay_order_id:
                    razorpayResponse.razorpay_order_id,

                  razorpay_payment_id:
                    razorpayResponse.razorpay_payment_id,

                  razorpay_signature:
                    razorpayResponse.razorpay_signature,
                }),
              }
            );

          const verifyData =
            await verifyResponse.json();

          console.log(
            "VERIFY PAYMENT RESPONSE:",
            verifyData
          );

          if (!verifyResponse.ok) {
            throw new Error(
              verifyData.message ||
                "Payment verification failed"
            );
          }

          // =================================================
          // CLEAR CART
          // =================================================

          clearCart();

          // =================================================
          // SUCCESS
          // =================================================

          navigate(
            "/order-success",
            {
              state: {
                order:
                  verifyData.order,

                payment:
                  razorpayResponse,
              },
            }
          );
        } catch (error) {
          console.error(
            "Payment verification error:",
            error
          );

          alert(
            error.message ||
              "Payment verification failed. Please contact support."
          );
        }
      },

      // =====================================================
      // PAYMENT WINDOW CLOSED
      // =====================================================

      modal: {
        ondismiss: function () {
          console.log(
            "Razorpay payment window closed."
          );
        },
      },
    };

    // =======================================================
    // OPEN RAZORPAY
    // =======================================================

    console.log(
      "Razorpay amount in paise:",
      paymentData.razorpayOrder.amount
    );

    console.log(
      "Razorpay amount in rupees:",
      Number(
        paymentData.razorpayOrder.amount
      ) / 100
    );

    const razorpay =
      new window.Razorpay(options);

    razorpay.on(
      "payment.failed",
      function (response) {
        console.error(
          "Razorpay payment failed:",
          response
        );

        alert(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      }
    );

    razorpay.open();

  } catch (error) {
    console.error(
      "Checkout error:",
      error
    );

    alert(
      error.message ||
        "Failed to start payment. Please try again."
    );
  }
};

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (
    cart.length === 0
  ) {
    return (
      <main className="empty-checkout">
        <div className="empty-checkout-content">

          <span>
            CHECKOUT
          </span>

          <h1>
            Your Cart Is Empty
          </h1>

          <p>
            Add some products before
            proceeding to checkout.
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

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="checkout-page">

      {/* HEADER */}

      <section className="checkout-header">

        <div>

          <p>
            MICKEY MOUSE • SECURE CHECKOUT
          </p>

          <h1>
            CHECKOUT
          </h1>

        </div>

        <span className="checkout-step">
          STEP 01 / 01
        </span>

      </section>

      <div className="checkout-container">

        {/* ===================================================
            LEFT
        ==================================================== */}

        <section className="checkout-form">

          <div className="checkout-progress">

            <div className="progress-step active">

              <span>
                01
              </span>

              <p>
                DETAILS
              </p>

            </div>

            <div className="progress-line"></div>

            <div className="progress-step">

              <span>
                02
              </span>

              <p>
                PAYMENT
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* =================================================
                CUSTOMER
            ================================================== */}

            <div className="checkout-section">

              <div className="checkout-section-title">

                <span>
                  01
                </span>

                <div>

                  <p>
                    YOUR DETAILS
                  </p>

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
                    value={
                      formData.firstName
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      formData.lastName
                    }
                    onChange={
                      handleChange
                    }
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
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* PHONE */}

              <div className="form-group">

                <label htmlFor="phone">
                  MOBILE NUMBER
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={
                    formData.phone
                  }
                  onChange={(e) =>
                    setFormData(
                      (
                        previous
                      ) => ({
                        ...previous,

                        phone:
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              10
                            ),
                      })
                    )
                  }
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  required
                />

                {otpError && (
                  <p
                    style={{
                      marginTop:
                        "8px",
                      color:
                        "red",
                    }}
                  >
                    {otpError}
                  </p>
                )}

                <p
                  style={{
                    marginTop:
                      "8px",
                  }}
                >
                  We will use this number to contact you about your order.
                </p>

              </div>

            </div>

            {/* =================================================
                ADDRESS
            ================================================== */}

            <div className="checkout-section">

              {!addressLoading &&
                savedAddresses.length >
                  0 && (

                  <div className="saved-addresses-checkout">

                    <div className="saved-addresses-checkout-heading">

                      <span>
                        SAVED ADDRESSES
                      </span>

                      <p>
                        SELECT AN ADDRESS
                      </p>

                    </div>

                    <div className="saved-addresses-checkout-list">

                      {savedAddresses.map(
                        (
                          address
                        ) => (

                          <button
                            type="button"
                            key={
                              address._id
                            }
                            className={`saved-address-checkout-card ${
                              selectedAddressId ===
                              address._id
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleSavedAddressSelect(
                                address
                              )
                            }
                          >

                            <div className="saved-address-checkout-top">

                              <strong>
                                {
                                  address.label
                                }
                              </strong>

                              {address.isDefault && (
                                <span>
                                  ★ DEFAULT
                                </span>
                              )}

                            </div>

                            <p>
                              {
                                address.fullName
                              }
                            </p>

                            <p>
                              {
                                address.address
                              }
                            </p>

                            <p>
                              {
                                address.city
                              }
                              ,{" "}
                              {
                                address.state
                              }
                            </p>

                            <p>
                              PIN:{" "}
                              {
                                address.pincode
                              }
                            </p>

                            <span className="saved-address-select">

                              {selectedAddressId ===
                              address._id
                                ? "✓ SELECTED"
                                : "USE THIS ADDRESS →"}

                            </span>

                          </button>

                        )
                      )}

                    </div>

                    <p className="saved-address-note">
                      You can edit the selected
                      address below before placing
                      your order.
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
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
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
                    value={
                      formData.city
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      formData.state
                    }
                    onChange={
                      handleChange
                    }
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
                  value={
                    formData.pincode
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />

              </div>

            </div>

            {/* =================================================
                PAYMENT
            ================================================== */}

            <div className="checkout-section">

              <div className="checkout-section-title">

                <span>
                  03
                </span>

                <div>

                  <p>
                    ALMOST THERE
                  </p>

                  <h2>
                    PAYMENT
                  </h2>

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
                You will be redirected to the
                secure Razorpay payment window
                after placing your order.
              </p>

            </div>

            {/* =================================================
                PRICE STATUS
            ================================================== */}

            {priceLoading && (
              <p>
                Checking latest product prices...
              </p>
            )}

            {priceChanged &&
              !priceLoading && (
                <p className="price-update-message">
                  Product prices have changed.
                  Your checkout total has been
                  updated to the latest prices.
                </p>
              )}

            {priceError && (
              <p>
                {priceError}
              </p>
            )}

            {/* =================================================
                PLACE ORDER
            ================================================== */}

            <button
              type="submit"
              className="place-order-button"
              disabled={
                priceLoading
              }
            >

              <span>
                {priceLoading
                  ? "CHECKING PRICES..."
                  : "CONTINUE TO SECURE PAYMENT"}
              </span>

              <span className="payment-arrow">
                →
              </span>

            </button>

          </form>

        </section>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <aside className="checkout-summary">

          <div className="checkout-summary-heading">

            <p>
              YOUR SELECTION
            </p>

            <h2>
              ORDER SUMMARY
            </h2>

          </div>

          {/* PRODUCTS */}

          <div className="checkout-products">

            {checkoutCart.map(
              (item) => (

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

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      {item.size} •{" "}
                      {item.category ||
                        "COLLECTION"}
                    </p>

                    <strong>
                      ₹
                      {(
                        Number(
                          item.price || 0
                        ) *
                        Number(
                          item.quantity ||
                            0
                        )
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    {Number(
                      item.stock || 0
                    ) <
                      Number(
                        item.quantity ||
                          0
                      ) && (
                      <p>
                        Only{" "}
                        {
                          item.stock
                        }{" "}
                        left in stock
                      </p>
                    )}

                  </div>

                </div>

              )
            )}

          </div>

          {/* COUPON */}

          <div className="checkout-coupon">

            <div className="checkout-coupon-heading">

              <span>
                HAVE A COUPON?
              </span>

              <p>
                APPLY YOUR DISCOUNT
              </p>

            </div>

            {!appliedCoupon ? (
              <>

                <div className="coupon-input-row">

                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={
                      couponCode
                    }
                    onChange={(e) =>
                      setCouponCode(
                        e.target.value.toUpperCase()
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleApplyCoupon
                    }
                    disabled={
                      couponLoading
                    }
                  >
                    {couponLoading
                      ? "CHECKING..."
                      : "APPLY"}
                  </button>

                </div>

                {couponError && (
                  <p className="coupon-error">
                    {
                      couponError
                    }
                  </p>
                )}

              </>
            ) : (

              <div className="applied-coupon">

                <div>

                  <strong>
                    {
                      appliedCoupon.code
                    }
                  </strong>

                  <span>
                    {
                      appliedCoupon.discountType ===
                      "percentage"
                        ? `${appliedCoupon.discountValue}% OFF`
                        : `₹${appliedCoupon.discountValue} OFF`
                    }
                  </span>

                </div>

                <button
                  type="button"
                  onClick={
                    handleRemoveCoupon
                  }
                >
                  REMOVE
                </button>

              </div>

            )}

          </div>

          {/* COUPON DISCOUNT */}

          {couponDiscount > 0 && (

            <div className="summary-row coupon-discount-row">

              <span>
                Coupon Discount
              </span>

              <span>
                -₹
                {couponDiscount.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

          )}

          {/* REWARD DISCOUNT */}

          {rewardDiscount > 0 && (

            <div className="summary-row reward-discount-row">

              <span>
                Reward Points
              </span>

              <span>
                -₹
                {rewardDiscount.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

          )}

          {/* REWARDS */}

          <div className="checkout-rewards">

            <div className="checkout-rewards-heading">

              <span>
                REWARD POINTS
              </span>

              <p>
                USE YOUR POINTS TO SAVE MORE
              </p>

            </div>

            {rewardLoading ? (

              <p>
                Loading reward points...
              </p>

            ) : rewardPoints > 0 ? (

              <>

                <div className="reward-balance">

                  <strong>
                    {
                      rewardPoints
                    }
                  </strong>

                  <span>
                    points available
                  </span>

                </div>

                <div className="reward-input-row">

                  <input
                    type="number"
                    min="0"
                    max={
                      rewardPoints
                    }
                    value={
                      rewardPointsUsed
                    }
                    onChange={
                      handleRewardPointsChange
                    }
                    placeholder="Points to use"
                  />

                  <span>
                    1 point = ₹1
                  </span>

                </div>

                {rewardDiscount >
                  0 && (

                  <p className="reward-applied">

                    ✓ ₹
                    {
                      rewardDiscount.toLocaleString(
                        "en-IN"
                      )
                    }{" "}
                    reward discount applied

                  </p>

                )}

              </>

            ) : (

              <p className="no-rewards">
                You don't have any reward
                points yet.
              </p>

            )}

          </div>

          {/* =================================================
              PRICE SUMMARY
          ================================================== */}

          <div className="checkout-price-summary">

            <div className="checkout-price-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {checkoutCartTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {couponDiscount > 0 && (

              <div className="checkout-price-row">

                <span>
                  Coupon Discount
                </span>

                <strong>
                  -₹
                  {couponDiscount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            )}

            {rewardDiscount > 0 && (

              <div className="checkout-price-row">

                <span>
                  Reward Discount
                </span>

                <strong>
                  -₹
                  {rewardDiscount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            )}

            <div className="checkout-price-row">

              <span>
                Delivery Charges
              </span>

              <strong>
                {deliveryCharge === 0
                  ? "FREE"
                  : `₹${deliveryCharge.toLocaleString(
                      "en-IN"
                    )}`}
              </strong>

            </div>

            <div className="checkout-price-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {finalTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

          {/* SECURE NOTE */}

          <div className="secure-note">
            🔒 Your payment is securely
            processed through Razorpay.
          </div>

          {/* BACK TO CART */}

          <button
            className="back-to-cart"
            type="button"
            onClick={() =>
              navigate("/cart")
            }
          >
            ← BACK TO CART
          </button>

        </aside>

      </div>

    </main>
  );
}

export default Checkout;