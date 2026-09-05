import { useEffect, useState } from "react";
import API_URL from "../api/apiConfig";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


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

  </main>
);
}

export default AdminDashboard;