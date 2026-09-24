import { useEffect, useRef, useState } from "react";
import API_URL from "../api/apiConfig";
import "./AdminReturnFeatures.css";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderDate, setSelectedOrderDate] = useState("");

  const [products, setProducts] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
const [returnLoading, setReturnLoading] = useState(true);
const [returnError, setReturnError] = useState("");
  const [productLoading, setProductLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    gender: "Men",
    price: "",
    originalPrice: "",
    description: "",
    sizes: "",
    colors: "",
    stock: "",
    isFeatured: false,
    isActive: true,
  });

  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    usageLimit: "",
    expiryDate: "",
    isActive: true,
  });

  const handleCouponChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

const recordReturnActivity = (orderId, item, status) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    orderId,
    itemName: item?.name || "Product",
    status,
    time: new Date().toISOString(),
  };

  setReturnActivity((current) => {
    const next = [entry, ...current].slice(0, 30);
    localStorage.setItem("spaceWearReturnActivity", JSON.stringify(next));
    return next;
  });
};

const notifyNewReturnRequests = (data) => {
  const requestedKeys = new Set(
    data.flatMap((order) =>
      (order.items || [])
        .filter((item) => item.returnStatus === "requested")
        .map((item) => `${order._id}:${item._id}`)
    )
  );

  const previous = returnSnapshotRef.current;

  if (previous) {
    const newKeys = [...requestedKeys].filter(
      (key) => !previous.has(key)
    );

    if (
      newKeys.length > 0 &&
      "Notification" in window
    ) {
      const showNotification = () => {
        new Notification("SPACE WEAR — New Return Request", {
          body: `${newKeys.length} new return request${newKeys.length > 1 ? "s" : ""} received.`,
        });
      };

      if (Notification.permission === "granted") {
        showNotification();
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") showNotification();
        });
      }
    }
  }

  returnSnapshotRef.current = requestedKeys;
};

const fetchReturnRequests = async () => {
  try {
    setReturnLoading(true);
    setReturnError("");

    const token = localStorage.getItem("token");

    console.log("=================================");
    console.log("🔥 FETCHING RETURN REQUESTS");
    console.log("API:", `${API_URL}/api/orders/admin/returns`);
    console.log("TOKEN EXISTS:", !!token);
    console.log("=================================");

    const response = await fetch(
      `${API_URL}/api/orders/admin/returns`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "🔥 RETURN RESPONSE STATUS:",
      response.status
    );

    const responseText = await response.text();

    console.log(
      "🔥 RETURN RESPONSE:",
      responseText
    );

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(
        `Server returned invalid response. Status: ${response.status}`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Failed to fetch return requests (${response.status})`
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Invalid return requests response from server"
      );
    }

    notifyNewReturnRequests(data);
    setReturnRequests(data);

  } catch (error) {
    console.error(
      "🔥 RETURN REQUESTS ERROR:",
      error
    );

    setReturnError(
      error.message ||
        "Failed to fetch return requests"
    );

  } finally {
    setReturnLoading(false);
  }
};

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/coupons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch coupons");
        }

        setCoupons(data);
      } catch (error) {
        console.error("Admin coupons error:", error);
      } finally {
        setCouponLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponForm.code,
          discountType: couponForm.discountType,
          discountValue: Number(couponForm.discountValue),
          minimumOrderAmount: Number(couponForm.minimumOrderAmount) || 0,
          maximumDiscount:
            couponForm.maximumDiscount === ""
              ? null
              : Number(couponForm.maximumDiscount),
          usageLimit:
            couponForm.usageLimit === ""
              ? null
              : Number(couponForm.usageLimit),
          expiryDate: couponForm.expiryDate,
          isActive: couponForm.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create coupon");
      }

      setCoupons((current) => [data.coupon, ...current]);

      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minimumOrderAmount: "",
        maximumDiscount: "",
        usageLimit: "",
        expiryDate: "",
        isActive: true,
      });

      setShowCouponForm(false);
      alert("Coupon created successfully!");
    } catch (error) {
      console.error("Create coupon error:", error);
      alert(error.message);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/coupons/${couponId}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update coupon");
      }

      setCoupons((current) =>
        current.map((coupon) =>
          coupon._id === couponId ? data.coupon : coupon
        )
      );
    } catch (error) {
      console.error("Toggle coupon error:", error);
      alert(error.message);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/coupons/${couponId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete coupon");
      }

      setCoupons((current) =>
        current.filter((coupon) => coupon._id !== couponId)
      );

      alert("Coupon deleted successfully!");
    } catch (error) {
      console.error("Delete coupon error:", error);
      alert(error.message);
    }
  };

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      sizes: product.sizes?.join(", ") || "",
      colors: product.colors?.join(", ") || "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      stock: product.stock ?? "",
      isFeatured: product.isFeatured ?? false,
      isActive: product.isActive ?? true,
      salePrice: product.salePrice ?? "",
      saleStart: product.saleStart
        ? new Date(product.saleStart).toISOString().slice(0, 16)
        : "",
      saleEnd: product.saleEnd
        ? new Date(product.saleEnd).toISOString().slice(0, 16)
        : "",
      isFlashSale: product.isFlashSale ?? false,
    });

    setShowEditForm(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      const token = localStorage.getItem("token");

      const productData = {
        name: editingProduct.name,
        category: editingProduct.category,
        gender: editingProduct.gender,
        price: Number(editingProduct.price),
        originalPrice: Number(editingProduct.originalPrice),
        description: editingProduct.description,
        sizes: editingProduct.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean),
        colors: editingProduct.colors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean),
        stock: Number(editingProduct.stock),
        isFeatured: editingProduct.isFeatured,
        isActive: editingProduct.isActive,
        salePrice: Number(editingProduct.salePrice) || 0,
        saleStart: editingProduct.saleStart
          ? new Date(editingProduct.saleStart)
          : null,
        saleEnd: editingProduct.saleEnd
          ? new Date(editingProduct.saleEnd)
          : null,
        isFlashSale: editingProduct.isFlashSale,
      };

      const response = await fetch(
        `${API_URL}/api/products/${editingProduct._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      setProducts((current) =>
        current.map((product) =>
          product._id === data._id ? data : product
        )
      );

      setEditingProduct(null);
      setShowEditForm(false);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Update product error:", error);
      alert(error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts((current) =>
        current.filter((product) => product._id !== productId)
      );

      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.message);
    }
  };

  const uploadProductImage = async () => {
    if (!productImage) {
      throw new Error("Please select a product image");
    }

    const formData = new FormData();
    formData.append("image", productImage);

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/uploads/product-image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Image upload failed");
    }

    return data.imageUrl;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const imageUrl = await uploadProductImage();

      const productData = {
        ...productForm,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice),
        stock: Number(productForm.stock),
        sizes: productForm.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean),
        colors: productForm.colors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean),
        image: imageUrl,
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      setProducts((current) => [data, ...current]);

      setProductForm({
        name: "",
        category: "",
        gender: "Men",
        price: "",
        originalPrice: "",
        description: "",
        sizes: "",
        colors: "",
        stock: "",
        isFeatured: false,
        isActive: true,
      });

      setProductImage(null);
      setShowProductForm(false);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Add product error:", error);
      alert(error.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update order status"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: status }
            : order
        )
      );
    } catch (error) {
      console.error("Status update error:", error);
      setError(error.message);
    }
  };

  const updateDeliveryDetails = async (
  orderId,
  deliveryMethod,
  courierProvider,
  trackingId
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/orders/${orderId}/delivery`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryMethod,
          courierProvider:
            deliveryMethod === "courier"
              ? courierProvider || null
              : null,
          trackingId:
            deliveryMethod === "courier"
              ? trackingId || null
              : null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update delivery details"
      );
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order._id === orderId
          ? data.order
          : order
      )
    );

    alert("Delivery details updated successfully!");
  } catch (error) {
    console.error(
      "Delivery update error:",
      error
    );

    alert(error.message);
  }
};

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this order?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete order");
      }

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order._id !== orderId)
      );

      alert("Order deleted successfully!");
    } catch (error) {
      console.error("Delete order error:", error);
      setError(error.message);
    }
  };

  const printDeliveryLabel = (order) => {
    const labelWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!labelWindow) {
      alert("Please allow popups to print the delivery label.");
      return;
    }

    const customerName =
      `${order.customer?.firstName || ""} ${
        order.customer?.lastName || ""
      }`.trim() || "Customer";

    const shippingAddress = order.shippingAddress || {};

    const productsHtml = (order.items || [])
      .map(
        (item) => `
          <div class="product">
            <strong>${item.name || "Product"}</strong>
            <span>
              Size: ${item.size || "N/A"} |
              Quantity: ${item.quantity || 0}
            </span>
          </div>
        `
      )
      .join("");

    labelWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }

          .label {
            border: 2px solid #111;
            padding: 30px;
            max-width: 650px;
            margin: auto;
          }

          .header {
            border-bottom: 2px solid #111;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
          }

          .order-id {
            margin-top: 8px;
            font-size: 14px;
          }

          .section {
            margin-top: 25px;
          }

          .section-title {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }

          .customer-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .address {
            font-size: 17px;
            line-height: 1.6;
          }

          .phone {
            margin-top: 10px;
            font-weight: bold;
          }

          .product {
            border-top: 1px solid #ccc;
            padding: 10px 0;
          }

          .product strong {
            display: block;
            font-size: 16px;
          }

          .product span {
            font-size: 14px;
          }

          @media print {
            body {
              padding: 0;
            }

            .label {
              border: 2px solid #111;
            }
          }
        </style>
      </head>

      <body>
        <div class="label">
          <div class="header">
            <h1>SPACE WEAR</h1>
            <div class="order-id">
              ORDER #${order._id.slice(-8).toUpperCase()}
            </div>
          </div>

          <div class="section">
            <div class="section-title">DELIVER TO</div>

            <div class="customer-name">
              ${customerName}
            </div>

            <div class="address">
              ${shippingAddress.address || ""}<br />
              ${shippingAddress.city || ""}<br />
              ${shippingAddress.state || ""} -
              ${shippingAddress.pincode || ""}
            </div>

            <div class="phone">
              PHONE: ${order.customer?.phone || ""}
            </div>
          </div>

          <div class="section">
            <div class="section-title">PRODUCTS</div>
            ${productsHtml}
          </div>
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    labelWindow.document.close();
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/admin/orders`,
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
        console.error("Admin orders error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch products"
          );
        }

        setProducts(data);
      } catch (error) {
        console.error("Admin products error:", error);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReturnRequests();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchReturnRequests();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);


const updateReturnStatus = async (
  orderId,
  itemId,
  returnStatus
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/orders/admin/returns/${orderId}/${itemId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update return status"
      );
    }

    let changedItem = null;

    setReturnRequests((currentRequests) =>
      currentRequests.map((order) => {
        if (order._id !== orderId) {
          return order;
        }

        return {
          ...order,
          items: order.items.map((item) => {
            if (item._id !== itemId) return item;
            changedItem = item;
            return {
              ...item,
              returnStatus,
              returnProcessedAt: new Date().toISOString(),
            };
          }),
        };
      })
    );

    recordReturnActivity(orderId, changedItem, returnStatus);
    alert(`Return status updated to ${returnStatus.replaceAll("_", " ")}.`);
  } catch (error) {
    console.error("Return status update error:", error);
    alert(error.message);
  }
};

const processReturnRefund = async (orderId, itemIndex) => {
  if (
    !window.confirm(
      "Process the Razorpay refund for this approved return?"
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/orders/admin/returns/${orderId}/${itemIndex}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to process refund"
      );
    }

    setReturnRequests((currentRequests) =>
      currentRequests.map((order) =>
        order._id === orderId ? data.order : order
      )
    );

    const refundedItem = data.order?.items?.[itemIndex];
    recordReturnActivity(orderId, refundedItem, "refunded");

    alert(
      `Refund initiated successfully: ₹${Number(
        data.refundAmount || 0
      ).toLocaleString("en-IN")}`
    );
  } catch (error) {
    console.error("Return refund error:", error);
    alert(error.message);
  }
};

  if (loading) {
    return (
      <div className="page-container">
        <h1>Admin Dashboard</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h1>Admin Dashboard</h1>
        <p>{error}</p>
      </div>
    );
  }

  const filteredOrders = selectedOrderDate
    ? orders.filter((order) => {
        if (!order.createdAt) return false;

        return (
          new Date(order.createdAt).toLocaleDateString("en-CA") ===
          selectedOrderDate
        );
      })
    : orders;

  const totalSales = orders.reduce(
    (total, order) => total + Number(order.totalAmount || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "delivered"
  ).length;

  const confirmedOrders = orders.filter(
    (order) => order.orderStatus === "confirmed"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.orderStatus === "processing"
  ).length;

  const shippedOrders = orders.filter(
    (order) => order.orderStatus === "shipped"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "cancelled"
  ).length;

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "paid"
  );

  const totalRevenue = paidOrders.reduce(
    (total, order) =>
      total + Number(order.totalAmount || 0),
    0
  );

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.isActive !== false
  ).length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) === 0
  );

  const allReturnItems = returnRequests.flatMap((order) =>
    (order.items || [])
      .map((item, itemIndex) => ({
        order,
        item,
        itemIndex,
      }))
      .filter(({ item }) => item.returnStatus && item.returnStatus !== "not_requested")
  );

  const returnStatusCounts = {
    requested: allReturnItems.filter(({ item }) => item.returnStatus === "requested").length,
    approved: allReturnItems.filter(({ item }) => item.returnStatus === "approved").length,
    picked_up: allReturnItems.filter(({ item }) => item.returnStatus === "picked_up").length,
    completed: allReturnItems.filter(({ item }) => item.returnStatus === "completed").length,
    rejected: allReturnItems.filter(({ item }) => item.returnStatus === "rejected").length,
    refunded: allReturnItems.filter(({ item }) => item.returnStatus === "refunded").length,
  };

  const totalReturnValue = allReturnItems.reduce(
    (total, { item }) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const totalRefunded = allReturnItems.reduce(
    (total, { item }) => total + Number(item.returnRefundAmount || 0),
    0
  );

  const filteredReturnItems = allReturnItems.filter(
    ({ order, item }) => {
      const customerName =
        `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
        order.userId?.name ||
        "";

      const searchable = [
        order._id,
        customerName,
        order.customer?.email,
        order.userId?.email,
        item.name,
        item.returnReason,
        item.returnComment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !returnSearch.trim() ||
        searchable.includes(returnSearch.trim().toLowerCase());

      const matchesStatus =
        returnStatusFilter === "all" ||
        item.returnStatus === returnStatusFilter;

      const matchesDate =
        !returnDateFilter ||
        (item.returnRequestedAt &&
          new Date(item.returnRequestedAt).toLocaleDateString("en-CA") ===
            returnDateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    }
  );

  const formatReturnDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getReturnTimeline = (item) => {
    const status = item.returnStatus;
    const stages = [
      { key: "requested", label: "Requested", date: item.returnRequestedAt },
      { key: "approved", label: "Approved", date: item.returnApprovedAt },
      { key: "picked_up", label: "Picked Up", date: status === "picked_up" ? item.returnProcessedAt : null },
      { key: "completed", label: "Completed", date: status === "completed" ? item.returnProcessedAt : null },
      { key: "refunded", label: "Refunded", date: item.returnRefundedAt },
    ];

    const order = ["requested", "approved", "picked_up", "completed", "refunded"];
    const currentIndex = order.indexOf(status);

    return stages.map((stage) => ({
      ...stage,
      done:
        stage.key === "requested" ||
        currentIndex >= order.indexOf(stage.key),
    }));
  };

  return (
    <main className="admin-page">

      <section className="admin-header">
        <div>
          <p className="admin-eyebrow">
            SPACE WEAR • ADMIN PANEL
          </p>
          <h1>ORDER MANAGEMENT</h1>
          <span>
            Monitor orders, payments and fulfilment from one place.
          </span>
        </div>

        <div className="admin-header-mark">
          <span>SW</span>
        </div>
      </section>

      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>REVENUE</span>
          <strong>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </strong>
          <small>FROM PAID ORDERS</small>
        </div>

        <div className="admin-stat-card">
          <span>TOTAL ORDERS</span>
          <strong>{orders.length}</strong>
          <small>ALL ORDERS</small>
        </div>

        <div className="admin-stat-card">
          <span>PRODUCTS</span>
          <strong>{totalProducts}</strong>
          <small>{activeProducts} ACTIVE</small>
        </div>

        <div className="admin-stat-card">
          <span>OUT OF STOCK</span>
          <strong>{outOfStockProducts.length}</strong>
          <small>PRODUCTS</small>
        </div>
      </section>

      <section className="admin-order-overview">
        <div className="admin-section-heading">
          <div>
            <span>ORDER ACTIVITY</span>
            <h2>ORDER OVERVIEW</h2>
          </div>
        </div>

        <div className="admin-order-stats">
          <div><span>PENDING</span><strong>{pendingOrders}</strong></div>
          <div><span>CONFIRMED</span><strong>{confirmedOrders}</strong></div>
          <div><span>PROCESSING</span><strong>{processingOrders}</strong></div>
          <div><span>SHIPPED</span><strong>{shippedOrders}</strong></div>
          <div><span>DELIVERED</span><strong>{deliveredOrders}</strong></div>
          <div><span>CANCELLED</span><strong>{cancelledOrders}</strong></div>
        </div>
      </section>

      <section className="admin-recent-section">
        <div className="admin-section-heading">
          <div>
            <span>LATEST ACTIVITY</span>
            <h2>RECENT ORDERS</h2>
          </div>

          <button
            className="admin-view-all-button"
            onClick={() =>
              document
                .querySelector(".admin-orders-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            VIEW ALL →
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="admin-empty-state">No orders yet.</div>
        ) : (
          <div className="admin-recent-orders">
            {[...orders]
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) -
                  new Date(a.createdAt || 0)
              )
              .slice(0, 5)
              .map((order) => (
                <div
                  className="admin-recent-order"
                  key={order._id}
                >
                  <div className="recent-order-main">
                    <span>ORDER</span>
                    <strong>
                      #{order._id.slice(-8).toUpperCase()}
                    </strong>
                  </div>

                  <div className="recent-order-customer">
                    <span>CUSTOMER</span>
                    <strong>
                      {order.customer?.name ||
                        order.userId?.name ||
                        `${order.customer?.firstName || ""} ${
                          order.customer?.lastName || ""
                        }`.trim() ||
                        "Customer"}
                    </strong>
                  </div>

                  <div className="recent-order-total">
                    <span>TOTAL</span>
                    <strong>
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="recent-order-status">
                    <span
                      className={`admin-status-badge ${
                        order.orderStatus || "pending"
                      }`}
                    >
                      {(order.orderStatus || "pending").toUpperCase()}
                    </span>
                  </div>

                  <div className="recent-order-date">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="admin-quick-section">
        <div className="admin-section-heading">
          <div>
            <span>SHORTCUTS</span>
            <h2>QUICK ACTIONS</h2>
          </div>
        </div>

        <div className="admin-quick-actions">
          <button
            onClick={() =>
              document
                .querySelector(".admin-add-product-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>01</span>
            <strong>ADD PRODUCT</strong>
            <small>CREATE A NEW PRODUCT →</small>
          </button>

          <button
            onClick={() =>
              document
                .querySelector(".admin-orders-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>02</span>
            <strong>MANAGE ORDERS</strong>
            <small>VIEW CUSTOMER ORDERS →</small>
          </button>

          <button
            onClick={() =>
              document
                .querySelector(".admin-coupons-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>03</span>
            <strong>COUPONS</strong>
            <small>MANAGE DISCOUNT CODES →</small>
          </button>

          <button
            onClick={() =>
              document
                .querySelector(".admin-products-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>04</span>
            <strong>PRODUCTS</strong>
            <small>MANAGE INVENTORY →</small>
          </button>
        </div>
      </section>

      {/* ORDERS */}
      <section className="admin-orders-section">
        <div className="admin-section-heading">
          <div>
            <p>ORDER MANAGEMENT</p>
            <h2>
              {selectedOrderDate ? "FILTERED ORDERS" : "ALL ORDERS"}
            </h2>
          </div>

          <div className="admin-order-date-filter">
            <label htmlFor="order-date">SELECT DATE</label>

            <input
              id="order-date"
              type="date"
              value={selectedOrderDate}
              onChange={(e) =>
                setSelectedOrderDate(e.target.value)
              }
            />

            {selectedOrderDate && (
              <button
                type="button"
                className="admin-clear-date-button"
                onClick={() => setSelectedOrderDate("")}
              >
                CLEAR
              </button>
            )}

            <span>
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "ORDER" : "ORDERS"}
            </span>
          </div>
        </div>

        {selectedOrderDate && (
          <div className="admin-orders-filter-info">
            Showing orders for{" "}
            <strong>
              {new Date(
                `${selectedOrderDate}T00:00:00`
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </strong>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="admin-empty-state">
            <span>NO ORDERS</span>
            <h2>No orders found</h2>
            <p>
              {selectedOrderDate
                ? "There are no orders for the selected date."
                : "Orders placed by customers will appear here."}
            </p>
          </div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => (
              <article
                className="admin-order-card"
                key={order._id}
              >
                <div className="admin-order-top">
                  <div>
                    <span className="admin-order-label">ORDER</span>
                    <h3>
                      #{order._id.slice(-8).toUpperCase()}
                    </h3>
                  </div>

                  <div className="admin-order-date">
                    <span>DATE</span>
                    <strong>
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                </div>

                <div className="admin-order-details">
                  <div className="admin-detail">
                    <span>CUSTOMER</span>
                    <strong>
                      {order.userId?.name ||
                        `${order.customer?.firstName || ""} ${
                          order.customer?.lastName || ""
                        }`.trim() ||
                        "Unknown"}
                    </strong>
                    <p>
                      {order.userId?.email ||
                        order.customer?.email ||
                        "No email"}
                    </p>
                  </div>

                  <div className="admin-detail">
                    <span>TOTAL</span>
                    <strong>
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </strong>
                    <p>Order value</p>
                  </div>

                  <div className="admin-detail">
                    <span>PAYMENT</span>
                    <strong
                      className={
                        order.paymentStatus === "paid"
                          ? "admin-status-paid"
                          : "admin-status-pending"
                      }
                    >
                      {order.paymentStatus}
                    </strong>
                    <p>Payment status</p>
                  </div>

                  <div className="admin-detail">
                    <span>ORDER STATUS</span>
                    <select
                      value={order.orderStatus || "pending"}
                      onChange={(e) =>
                        updateOrderStatus(
                          order._id,
                          e.target.value
                        )
                      }
                      className={`admin-status-select status-${
                        order.orderStatus || "pending"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <p>Update fulfilment status</p>
                  </div>

                  <div className="admin-detail">
  <span>DELIVERY METHOD</span>

  <select
    value={order.deliveryMethod || "own_delivery"}
    onChange={(e) => {
      const method = e.target.value;

      updateDeliveryDetails(
        order._id,
        method,
        order.courierProvider || "",
        order.trackingId || ""
      );
    }}
    className="admin-status-select"
  >
    <option value="own_delivery">
      Own Delivery
    </option>

    <option value="courier">
      Courier
    </option>
  </select>

  <p>
    Admin selects delivery method
  </p>
</div>

{order.deliveryMethod === "courier" && (
  <>
    <div className="admin-detail">
      <span>COURIER</span>

      <select
        value={order.courierProvider || ""}
        onChange={(e) =>
          updateDeliveryDetails(
            order._id,
            "courier",
            e.target.value,
            order.trackingId || ""
          )
        }
        className="admin-status-select"
      >
        <option value="">
          Select Courier
        </option>

        <option value="delhivery">
          Delhivery
        </option>

        <option value="other">
          Other Courier
        </option>
      </select>
    </div>

    <div className="admin-detail">
      <span>TRACKING ID</span>

      <input
        type="text"
        value={order.trackingId || ""}
        placeholder="Enter tracking ID"
        onChange={(e) =>
          setOrders((currentOrders) =>
            currentOrders.map((item) =>
              item._id === order._id
                ? {
                    ...item,
                    trackingId:
                      e.target.value,
                  }
                : item
            )
          )
        }
        onBlur={() =>
          updateDeliveryDetails(
            order._id,
            "courier",
            order.courierProvider || "",
            order.trackingId || ""
          )
        }
      />

      <p>
        Enter courier tracking / AWB number
      </p>
    </div>
  </>
)}
                </div>

                {/* DELIVERY */}
                <div className="admin-delivery-section">
                  <div className="admin-delivery-header">
                    <div>
                      <span>DELIVERY INFORMATION</span>
                      <h3>SHIPPING ADDRESS</h3>
                    </div>

                   
                  </div>

                  <div className="admin-delivery-details">
                    <strong>
                      {order.customer?.firstName || ""}
                      {" "}
                      {order.customer?.lastName || ""}
                    </strong>

                    <p>
                      {order.shippingAddress?.address ||
                        "No address"}
                    </p>

                    <p>
                      {order.shippingAddress?.city || ""}
                      {order.shippingAddress?.city &&
                      order.shippingAddress?.state
                        ? ", "
                        : ""}
                      {order.shippingAddress?.state || ""}
                      {order.shippingAddress?.pincode
                        ? ` - ${order.shippingAddress.pincode}`
                        : ""}
                    </p>

                    <p>
                      Phone:{" "}
                      {order.customer?.phone || "No phone"}
                    </p>
                  </div>

                  <div className="admin-order-products">
                    <span>PRODUCTS</span>

                    {(order.items || []).map((item, index) => (
                      <div
                        className="admin-order-product"
                        key={`${item.productId?._id || item.productId || item.name}-${index}`}
                      >
                        <strong>
                          {item.name || "Product"}
                        </strong>

                        <small>
                          Size: {item.size || "N/A"} ·
                          Quantity: {item.quantity || 0}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                 <div className="admin-delivery-actions">
                      <button
                        type="button"
                        className="admin-print-label-button"
                        onClick={() =>
                          printDeliveryLabel(order)
                        }
                      >
                        PRINT DELIVERY LABEL
                      </button>
                       <button
                        type="button"
                        className="admin-delete-order-button"
                        onClick={() =>
                          handleDeleteOrder(order._id)
                        }
                      >
                        DELETE ORDER
                      </button>

                    
                    </div>
              
              </article>
            ))}
          </div>
        )}
      </section>

      {/* PRODUCTS */}
      <section className="admin-products-section">
        <div className="admin-section-heading">
          <div>
            <p>PRODUCT MANAGEMENT</p>
            <h2>ALL PRODUCTS</h2>
          </div>

          <div>
            <span>
              {products.length}{" "}
              {products.length === 1 ? "PRODUCT" : "PRODUCTS"}
            </span>

            <button
              type="button"
              className="admin-add-product-button"
              onClick={() => setShowProductForm(true)}
            >
              + ADD PRODUCT
            </button>
          </div>
        </div>

        {showProductForm && (
          <form
            className="admin-product-form"
            onSubmit={handleAddProduct}
          >
            <h3>ADD NEW PRODUCT</h3>

            <input
              type="text"
              name="name"
              placeholder="Product name"
              value={productForm.name}
              onChange={handleProductChange}
            />

            <input
              type="text"
              name="category"
              placeholder="Category"
              value={productForm.category}
              onChange={handleProductChange}
            />

            <select
              name="gender"
              value={productForm.gender}
              onChange={handleProductChange}
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={productForm.price}
              onChange={handleProductChange}
            />

            <input
              type="number"
              name="originalPrice"
              placeholder="Original price"
              value={productForm.originalPrice}
              onChange={handleProductChange}
            />

            <textarea
              name="description"
              placeholder="Product description"
              value={productForm.description}
              onChange={handleProductChange}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setProductImage(e.target.files[0])
              }
            />

            <input
              type="text"
              name="sizes"
              placeholder="Sizes (example: S, M, L, XL)"
              value={productForm.sizes}
              onChange={handleProductChange}
            />

            <input
              type="text"
              name="colors"
              placeholder="Colors (example: Black, White)"
              value={productForm.colors}
              onChange={handleProductChange}
            />

            <input
              type="number"
              name="stock"
              placeholder="Stock quantity"
              value={productForm.stock}
              onChange={handleProductChange}
            />

            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={productForm.isFeatured}
                onChange={handleProductChange}
              />
              Featured product
            </label>

            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={productForm.isActive}
                onChange={handleProductChange}
              />
              Active product
            </label>

            <button
              type="submit"
              className="admin-save-product-button"
            >
              SAVE PRODUCT
            </button>
          </form>
        )}

        {showEditForm && editingProduct && (
          <form
            className="admin-product-form admin-edit-product-form"
            onSubmit={handleUpdateProduct}
          >
            <div className="admin-edit-form-header">
              <div>
                <p>PRODUCT MANAGEMENT</p>
                <h3>EDIT PRODUCT</h3>
              </div>

              <button
                type="button"
                className="admin-close-form-button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowEditForm(false);
                }}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  name: e.target.value,
                })
              }
              placeholder="Product name"
            />

            <input
              type="text"
              value={editingProduct.category}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value,
                })
              }
              placeholder="Category"
            />

            <select
              value={editingProduct.gender}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  gender: e.target.value,
                })
              }
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>

            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: e.target.value,
                })
              }
              placeholder="Price"
            />

            <input
              type="number"
              value={editingProduct.originalPrice}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  originalPrice: e.target.value,
                })
              }
              placeholder="Original price"
            />

            <textarea
              value={editingProduct.description}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  description: e.target.value,
                })
              }
              placeholder="Product description"
            />

            <input
              type="text"
              value={editingProduct.sizes}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  sizes: e.target.value,
                })
              }
              placeholder="Sizes: S, M, L, XL"
            />

            <input
              type="text"
              value={editingProduct.colors}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  colors: e.target.value,
                })
              }
              placeholder="Colors: Black, White"
            />

            <input
              type="number"
              min="0"
              value={editingProduct.stock}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  stock: e.target.value,
                })
              }
              placeholder="Stock quantity"
            />

            <label>
              <input
                type="checkbox"
                checked={editingProduct.isFeatured}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    isFeatured: e.target.checked,
                  })
                }
              />
              Featured product
            </label>

            <label>
              <input
                type="checkbox"
                checked={editingProduct.isActive}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    isActive: e.target.checked,
                  })
                }
              />
              Active product
            </label>

            <div className="admin-flash-sale-box">
              <div className="admin-flash-sale-header">
                <div>
                  <span>LIMITED TIME</span>
                  <h4>FLASH SALE</h4>
                </div>

                <label className="admin-flash-toggle">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFlashSale ?? false}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isFlashSale: e.target.checked,
                      })
                    }
                  />
                  <span>ENABLE</span>
                </label>
              </div>

              {editingProduct.isFlashSale && (
                <div className="admin-flash-sale-fields">
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.salePrice ?? ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        salePrice: e.target.value,
                      })
                    }
                    placeholder="Flash sale price"
                  />

                  <div className="admin-date-field">
                    <label>SALE START</label>
                    <input
                      type="datetime-local"
                      value={editingProduct.saleStart ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          saleStart: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="admin-date-field">
                    <label>SALE END</label>
                    <input
                      type="datetime-local"
                      value={editingProduct.saleEnd ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          saleEnd: e.target.value,
                        })
                      }
                    />
                  </div>

                  <p className="admin-flash-sale-help">
                    The product will appear in Flash Sale only during
                    the selected period.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="admin-save-product-button"
            >
              SAVE CHANGES
            </button>
          </form>
        )}

        {productLoading ? (
          <div className="admin-empty-state">
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <span>NO PRODUCTS</span>
            <h2>No products found</h2>
            <p>Products added to the store will appear here.</p>
          </div>
        ) : (
          <div className="admin-products-list">
            {products.map((product) => (
              <article
                className="admin-product-card"
                key={product._id}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="admin-product-image"
                />

                <div className="admin-product-info">
                  <span>{product.category}</span>

                  <h3>{product.name}</h3>

                  <strong>
                    ₹{Number(product.price || 0).toLocaleString("en-IN")}
                  </strong>

                  <div className="admin-stock-status">
                    {Number(product.stock || 0) === 0 ? (
                      <span className="stock-out">
                        OUT OF STOCK
                      </span>
                    ) : Number(product.stock || 0) <= 5 ? (
                      <span className="stock-low">
                        ONLY {product.stock} LEFT
                      </span>
                    ) : (
                      <span className="stock-in">
                        IN STOCK · {product.stock}
                      </span>
                    )}
                  </div>

                  <div className="admin-product-badges">
                    {product.isFeatured && (
                      <span className="admin-badge admin-badge-featured">
                        FEATURED
                      </span>
                    )}

                    {!product.isActive && (
                      <span className="admin-badge admin-badge-inactive">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="admin-edit-product-button"
                      onClick={() =>
                        handleEditProduct(product)
                      }
                    >
                      EDIT
                    </button>

                    <button
                      type="button"
                      className="admin-delete-product-button"
                      onClick={() =>
                        handleDeleteProduct(product._id)
                      }
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-low-stock">
        <div className="admin-section-heading">
          <div>
            <span>INVENTORY ALERT</span>
            <h2>LOW STOCK PRODUCTS</h2>
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="admin-no-alert">
            ✓ All products have healthy stock levels.
          </div>
        ) : (
          <div className="admin-low-stock-list">
            {lowStockProducts.map((product) => (
              <div
                className="admin-low-stock-item"
                key={product._id}
              >
                <img
                  src={product.image}
                  alt={product.name}
                />

                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category}</span>
                </div>

                <b>ONLY {product.stock} LEFT</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COUPONS */}
      <section className="admin-section coupon-management admin-coupons-section">
        <div className="section-header">
          <div>
            <h2>Coupon Management</h2>
            <p>Create and manage discount coupons</p>
          </div>

          <button
            className="admin-btn primary"
            onClick={() =>
              setShowCouponForm((current) => !current)
            }
          >
            {showCouponForm ? "Close Form" : "+ Add Coupon"}
          </button>
        </div>

        {showCouponForm && (
          <form
            className="coupon-form"
            onSubmit={handleAddCoupon}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Coupon Code</label>
                <input
                  type="text"
                  name="code"
                  value={couponForm.code}
                  onChange={handleCouponChange}
                  placeholder="e.g. MM10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Type</label>
                <select
                  name="discountType"
                  value={couponForm.discountType}
                  onChange={handleCouponChange}
                >
                  <option value="percentage">
                    Percentage (%)
                  </option>
                  <option value="fixed">
                    Fixed Amount (₹)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Discount Value</label>
                <input
                  type="number"
                  name="discountValue"
                  value={couponForm.discountValue}
                  onChange={handleCouponChange}
                  placeholder="e.g. 10"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Minimum Order Amount</label>
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={couponForm.minimumOrderAmount}
                  onChange={handleCouponChange}
                  placeholder="e.g. 500"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Maximum Discount</label>
                <input
                  type="number"
                  name="maximumDiscount"
                  value={couponForm.maximumDiscount}
                  onChange={handleCouponChange}
                  placeholder="Optional"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={couponForm.usageLimit}
                  onChange={handleCouponChange}
                  placeholder="Unlimited if empty"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="datetime-local"
                  name="expiryDate"
                  value={couponForm.expiryDate}
                  onChange={handleCouponChange}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={couponForm.isActive}
                    onChange={handleCouponChange}
                  />
                  Active Coupon
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="admin-btn primary"
            >
              Create Coupon
            </button>
          </form>
        )}

        <div className="coupon-list">
          {couponLoading ? (
            <p>Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="empty-message">
              No coupons created yet.
            </p>
          ) : (
            coupons.map((coupon) => (
              <div
                className="coupon-card"
                key={coupon._id}
              >
                <div className="coupon-info">
                  <div className="coupon-code">
                    {coupon.code}
                  </div>

                  <div className="coupon-discount">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} OFF`}
                  </div>

                  <div className="coupon-details">
                    <span>
                      Min Order: ₹{coupon.minimumOrderAmount}
                    </span>

                    <span>
                      {coupon.maximumDiscount !== null
                        ? `Max Discount: ₹${coupon.maximumDiscount}`
                        : "No max discount"}
                    </span>

                    <span>
                      {coupon.usageLimit !== null
                        ? `Used: ${coupon.usedCount}/${coupon.usageLimit}`
                        : `Used: ${coupon.usedCount}`}
                    </span>

                    <span>
                      Expires:{" "}
                      {new Date(
                        coupon.expiryDate
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="coupon-actions">
                  <span
                    className={
                      coupon.isActive
                        ? "coupon-status active"
                        : "coupon-status inactive"
                    }
                  >
                    {coupon.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    className="admin-btn secondary"
                    onClick={() =>
                      handleToggleCoupon(coupon._id)
                    }
                  >
                    {coupon.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    className="admin-btn danger"
                    onClick={() =>
                      handleDeleteCoupon(coupon._id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* =====================================================
    RETURN REQUESTS — ENHANCED
===================================================== */}

<section className="admin-returns-section">

  <div className="admin-section-heading">
    <div>
      <p>RETURN MANAGEMENT</p>
      <h2>RETURNS CONTROL CENTER</h2>
    </div>
    <button
      type="button"
      className="return-refresh-button"
      onClick={fetchReturnRequests}
    >
      ↻ REFRESH
    </button>
  </div>

  <div className="return-analytics-grid">
    <div className="return-analytics-card">
      <span>TOTAL RETURNS</span>
      <strong>{allReturnItems.length}</strong>
      <small>ALL REQUESTS</small>
    </div>
    <div className="return-analytics-card return-alert-card">
      <span>PENDING</span>
      <strong>{returnStatusCounts.requested}</strong>
      <small>NEEDS REVIEW</small>
    </div>
    <div className="return-analytics-card">
      <span>APPROVED</span>
      <strong>{returnStatusCounts.approved}</strong>
      <small>READY FOR NEXT STEP</small>
    </div>
    <div className="return-analytics-card">
      <span>REFUNDED</span>
      <strong>{returnStatusCounts.refunded}</strong>
      <small>COMPLETED REFUNDS</small>
    </div>
    <div className="return-analytics-card">
      <span>RETURN VALUE</span>
      <strong>₹{totalReturnValue.toLocaleString("en-IN")}</strong>
      <small>GROSS ITEM VALUE</small>
    </div>
    <div className="return-analytics-card">
      <span>REFUNDED VALUE</span>
      <strong>₹{totalRefunded.toLocaleString("en-IN")}</strong>
      <small>RAZORPAY REFUNDS</small>
    </div>
  </div>

  <div className="return-status-summary">
    {[
      ["requested", "Requested"],
      ["approved", "Approved"],
      ["picked_up", "Picked Up"],
      ["completed", "Completed"],
      ["rejected", "Rejected"],
      ["refunded", "Refunded"],
    ].map(([key, label]) => (
      <button
        key={key}
        type="button"
        className={`return-filter-chip ${
          returnStatusFilter === key ? "active" : ""
        }`}
        onClick={() =>
          setReturnStatusFilter(
            returnStatusFilter === key ? "all" : key
          )
        }
      >
        {label}
        <strong>{returnStatusCounts[key]}</strong>
      </button>
    ))}
  </div>

  <div className="return-toolbar">
    <input
      type="search"
      value={returnSearch}
      onChange={(e) => setReturnSearch(e.target.value)}
      placeholder="Search order ID, customer, email, product or reason..."
      className="return-search-input"
    />

    <select
      value={returnStatusFilter}
      onChange={(e) => setReturnStatusFilter(e.target.value)}
      className="return-filter-select"
    >
      <option value="all">All statuses</option>
      <option value="requested">Requested</option>
      <option value="approved">Approved</option>
      <option value="picked_up">Picked Up</option>
      <option value="completed">Completed</option>
      <option value="rejected">Rejected</option>
      <option value="refunded">Refunded</option>
    </select>

    <input
      type="date"
      value={returnDateFilter}
      onChange={(e) => setReturnDateFilter(e.target.value)}
      className="return-filter-date"
    />

    {(returnSearch || returnStatusFilter !== "all" || returnDateFilter) && (
      <button
        type="button"
        className="return-clear-button"
        onClick={() => {
          setReturnSearch("");
          setReturnStatusFilter("all");
          setReturnDateFilter("");
        }}
      >
        CLEAR
      </button>
    )}
  </div>

  <div className="return-result-count">
    Showing <strong>{filteredReturnItems.length}</strong> return item
    {filteredReturnItems.length === 1 ? "" : "s"}
  </div>

  {returnLoading ? (
    <div className="admin-empty-state">
      <p>Loading return requests...</p>
    </div>
  ) : returnError ? (
    <div className="admin-empty-state">
      <span>RETURN ERROR</span>
      <h2>Unable to Load Returns</h2>
      <p>{returnError}</p>
      <button type="button" onClick={fetchReturnRequests}>
        TRY AGAIN
      </button>
    </div>
  ) : filteredReturnItems.length === 0 ? (
    <div className="admin-empty-state">
      <span>NO MATCHES</span>
      <h2>No returns found</h2>
      <p>Try changing the search or filters.</p>
    </div>
  ) : (
    <div className="admin-orders-list">
      {filteredReturnItems.map(({ order, item, itemIndex }) => {
        const customerName =
          `${order.customer?.firstName || ""} ${
            order.customer?.lastName || ""
          }`.trim() ||
          order.userId?.name ||
          "Customer";

        const timeline = getReturnTimeline(item);

        return (
          <article
            className="admin-order-card admin-return-card"
            key={`${order._id}-${item._id}`}
          >
            <div className="admin-order-top">
              <div>
                <span className="admin-order-label">RETURN REQUEST</span>
                <h3>#{order._id.slice(-8).toUpperCase()}</h3>
              </div>
              <div className="admin-order-date">
                <span>REQUESTED</span>
                <strong>{formatReturnDate(item.returnRequestedAt)}</strong>
              </div>
            </div>

            <div className="admin-order-details">
              <div className="admin-detail">
                <span>CUSTOMER</span>
                <strong>{customerName}</strong>
                <p>
                  {order.customer?.email ||
                    order.userId?.email ||
                    "No email"}
                </p>
              </div>

              <div className="admin-detail">
                <span>ORDER</span>
                <strong>
                  ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                </strong>
                <p>{order.paymentStatus || "Payment status unavailable"}</p>
              </div>

              <div className="admin-detail">
                <span>RETURN ITEM</span>
                <strong>{item.name || "Product"}</strong>
                <p>
                  Qty {item.quantity || 0}
                  {item.size ? ` · Size ${item.size}` : ""}
                </p>
              </div>

              <div className="admin-detail">
                <span>REFUND</span>
                <strong>
                  ₹
                  {Number(item.returnRefundAmount || 0).toLocaleString(
                    "en-IN"
                  )}
                </strong>
                <p>
                  {item.returnRefundedAt
                    ? `Refunded ${formatReturnDate(item.returnRefundedAt)}`
                    : "Not refunded"}
                </p>
              </div>
            </div>

            <div className="return-reason-panel">
              <div>
                <span>RETURN REASON</span>
                <strong>{item.returnReason || "Not provided"}</strong>
              </div>
              {item.returnComment && (
                <div>
                  <span>CUSTOMER COMMENT</span>
                  <p>{item.returnComment}</p>
                </div>
              )}
              {item.returnAdminNote && (
                <div>
                  <span>ADMIN NOTE</span>
                  <p>{item.returnAdminNote}</p>
                </div>
              )}
            </div>

            <div className="return-timeline">
              {timeline.map((stage) => (
                <div
                  key={stage.key}
                  className={`return-timeline-step ${
                    stage.done ? "done" : ""
                  }`}
                >
                  <span className="return-timeline-dot">
                    {stage.done ? "✓" : ""}
                  </span>
                  <div>
                    <strong>{stage.label}</strong>
                    <small>
                      {stage.date ? formatReturnDate(stage.date) : "Pending"}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-return-actions">
              <span>STATUS</span>

              <strong
                className={`admin-return-status status-${item.returnStatus}`}
              >
                {String(item.returnStatus || "unknown")
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </strong>

              {item.returnStatus === "requested" && (
                <div className="admin-return-buttons">
                  <button
                    type="button"
                    className="admin-return-approve"
                    onClick={() =>
                      updateReturnStatus(
                        order._id,
                        item._id,
                        "approved"
                      )
                    }
                  >
                    ✓ APPROVE
                  </button>

                  <button
                    type="button"
                    className="admin-return-reject"
                    onClick={() =>
                      updateReturnStatus(
                        order._id,
                        item._id,
                        "rejected"
                      )
                    }
                  >
                    ✕ REJECT
                  </button>
                </div>
              )}

              {item.returnStatus === "approved" && (
                <div className="return-action-row">
                  <button
                    type="button"
                    className="admin-return-pickup"
                    onClick={() =>
                      updateReturnStatus(
                        order._id,
                        item._id,
                        "picked_up"
                      )
                    }
                  >
                    MARK PICKED UP
                  </button>

                  <button
                    type="button"
                    className="return-refund-button"
                    onClick={() =>
                      processReturnRefund(order._id, itemIndex)
                    }
                    disabled={order.paymentStatus !== "paid"}
                    title={
                      order.paymentStatus !== "paid"
                        ? "Only paid orders can be refunded"
                        : "Process Razorpay refund"
                    }
                  >
                    ₹ REFUND
                  </button>
                </div>
              )}

              {item.returnStatus === "picked_up" && (
                <button
                  type="button"
                  className="admin-return-complete"
                  onClick={() =>
                    updateReturnStatus(
                      order._id,
                      item._id,
                      "completed"
                    )
                  }
                >
                  MARK COMPLETED
                </button>
              )}

              {item.returnStatus === "refunded" && (
                <span className="return-refunded-confirmation">
                  ✓ REFUND PROCESSED
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  )}

  <div className="return-activity-panel">
    <div className="admin-section-heading">
      <div>
        <p>ADMIN AUDIT</p>
        <h2>RECENT RETURN ACTIVITY</h2>
      </div>
      {returnActivity.length > 0 && (
        <button
          type="button"
          className="return-clear-button"
          onClick={() => {
            setReturnActivity([]);
            localStorage.removeItem("spaceWearReturnActivity");
          }}
        >
          CLEAR LOG
        </button>
      )}
    </div>

    {returnActivity.length === 0 ? (
      <p className="return-activity-empty">
        Status changes made from this browser will appear here.
      </p>
    ) : (
      <div className="return-activity-list">
        {returnActivity.slice(0, 8).map((entry) => (
          <div className="return-activity-row" key={entry.id}>
            <span className={`activity-dot activity-${entry.status}`} />
            <div>
              <strong>{entry.itemName}</strong>
              <p>
                Order #{String(entry.orderId).slice(-8).toUpperCase()} ·{" "}
                {String(entry.status).replaceAll("_", " ").toUpperCase()}
              </p>
            </div>
            <time>{new Date(entry.time).toLocaleString("en-IN")}</time>
          </div>
        ))}
      </div>
    )}
  </div>

</section>

    </main>
  );
}

export default AdminDashboard;
