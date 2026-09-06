import { useEffect, useState } from "react";
import API_URL from "../api/apiConfig";


function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);
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
  });

  setShowEditForm(true);
};
const handleUpdateProduct = async (e) => {
  e.preventDefault();

  if (!editingProduct) {
    return;
  }

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
      throw new Error(
        data.message || "Failed to update product"
      );
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
  const confirmed = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete product"
      );
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
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }
);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Image upload failed"
    );
  }

  return data.imageUrl;
};

const handleAddProduct = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    // Upload image to Cloudinary
    const imageUrl = await uploadProductImage();

    // Prepare product data
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

    // Save product to MongoDB
    const response = await fetch(
      `${API_URL}/api/products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to create product"
      );
    }

    // Add new product to the screen
    setProducts((current) => [data, ...current]);

    // Reset form
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
        body: JSON.stringify({
          status,
        }),
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
          ? {
              ...order,
              orderStatus: status,
            }
          : order
      )
    );
  } catch (error) {
    console.error("Status update error:", error);
    setError(error.message);
  }
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
      const response = await fetch(
        `${API_URL}/api/products`
      );

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

  const totalSales = orders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );
  const pendingOrders = orders.filter(
  (order) => order.orderStatus === "pending"
).length;

const deliveredOrders = orders.filter(
  (order) => order.orderStatus === "delivered"
).length;

 return (
  <main className="admin-page">

    {/* HEADER */}

    <section className="admin-header">

      <div>
        <p className="admin-eyebrow">
          MICKEY MOUSE • ADMIN PANEL
        </p>

        <h1>ORDER MANAGEMENT</h1>

        <span>
          Monitor orders, payments and fulfilment from one place.
        </span>
      </div>

      <div className="admin-header-mark">
        <span>MM</span>
      </div>

    </section>


    {/* STATISTICS */}

    <section className="admin-stats">

      <div className="admin-stat-card">
        <span className="admin-stat-label">
          TOTAL ORDERS
        </span>

        <strong>
          {orders.length}
        </strong>

        <p>
          All orders received
        </p>
      </div>


      <div className="admin-stat-card">
        <span className="admin-stat-label">
          TOTAL SALES
        </span>

        <strong>
          ₹{totalSales.toLocaleString("en-IN")}
        </strong>

        <p>
          Revenue from orders
        </p>
      </div>


      <div className="admin-stat-card">
        <span className="admin-stat-label">
          PENDING
        </span>

        <strong>
          {pendingOrders}
        </strong>

        <p>
          Awaiting processing
        </p>
      </div>


      <div className="admin-stat-card">
        <span className="admin-stat-label">
          DELIVERED
        </span>

        <strong>
          {deliveredOrders}
        </strong>

        <p>
          Successfully delivered
        </p>
      </div>

    </section>


    {/* ORDERS */}

    <section className="admin-orders-section">

      <div className="admin-section-heading">

        <div>
          <p>ORDER MANAGEMENT</p>

          <h2>ALL ORDERS</h2>
        </div>

        <span>
          {orders.length}{" "}
          {orders.length === 1 ? "ORDER" : "ORDERS"}
        </span>

      </div>


      {orders.length === 0 ? (

        <div className="admin-empty-state">

          <span>NO ORDERS</span>

          <h2>No orders found</h2>

          <p>
            Orders placed by customers will appear here.
          </p>

        </div>

      ) : (

        <div className="admin-orders-list">

          {orders.map((order) => (

            <article
              className="admin-order-card"
              key={order._id}
            >

              {/* ORDER HEADER */}

              <div className="admin-order-top">

                <div>

                  <span className="admin-order-label">
                    ORDER
                  </span>

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


              {/* ORDER DETAILS */}

              <div className="admin-order-details">

                <div className="admin-detail">

                  <span>CUSTOMER</span>

                  <strong>
                    {order.userId?.name || "Unknown"}
                  </strong>

                  <p>
                    {order.userId?.email || "No email"}
                  </p>

                </div>


                <div className="admin-detail">

                  <span>TOTAL</span>

                  <strong>
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </strong>

                  <p>
                    Order value
                  </p>

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

                  <p>
                    Payment status
                  </p>

                </div>


                <div className="admin-detail">

                  <span>ORDER STATUS</span>

                  <select
                    value={order.orderStatus}
                    onChange={(e) =>
                      updateOrderStatus(
                        order._id,
                        e.target.value
                      )
                    }
                    className={`admin-status-select status-${order.orderStatus}`}
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                  </select>

                  <p>
                    Update fulfilment status
                  </p>

                </div>

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
    onChange={(e) => setProductImage(e.target.files[0])}
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

          <p>
            Products added to the store will appear here.
          </p>

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

                <span>
                  {product.category}
                </span>

                <h3>
                  {product.name}
                </h3>

                <strong>
                  ₹{product.price.toLocaleString("en-IN")}
                </strong>

                <div className="admin-stock-status">
  {product.stock === 0 ? (
    <span className="stock-out">
      OUT OF STOCK
    </span>
  ) : product.stock <= 5 ? (
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
    onClick={() => handleEditProduct(product)}
  >
    EDIT
  </button>

                <button
  type="button"
  className="admin-delete-product-button"
  onClick={() => handleDeleteProduct(product._id)}
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

  </main>
);
}

export default AdminDashboard;