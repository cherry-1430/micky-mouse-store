import { useEffect, useState } from "react";
import API_URL from "../api/apiConfig";

function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReturns = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/admin/returns`,
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
          "Failed to load returns"
        );
      }

      setReturns(
        data.returns || []
      );

    } catch (error) {
      console.error(
        "Returns error:",
        error
      );

      setError(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const updateReturnStatus = async (
    orderId,
    itemId,
    status
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_URL}/api/orders/admin/returns/${orderId}/${itemId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update return"
        );
      }

      alert(
        `Return ${status} successfully`
      );

      fetchReturns();

    } catch (error) {
      console.error(
        "Update return error:",
        error
      );

      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-returns">
        <h2>
          Loading Return Requests...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-returns">
        <h2>
          Unable to load returns
        </h2>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-returns">

      <div className="admin-returns-header">
        <div>
          <span>
            CUSTOMER SERVICE
          </span>

          <h1>
            RETURN REQUESTS
          </h1>
        </div>

        <div className="return-count">
          {returns.length}
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="no-returns">
          <div>📦</div>

          <h2>
            No Return Requests
          </h2>

          <p>
            There are currently no
            customer return requests.
          </p>
        </div>
      ) : (
        <div className="returns-list">

          {returns.map((item) => (

            <div
              className="admin-return-card"
              key={`${item.orderId}-${item.itemId}`}
            >

              {/* PRODUCT */}

              <div className="return-product">

                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                  />
                )}

                <div>
                  <span>
                    ORDER #
                    {item.orderNumber}
                  </span>

                  <h3>
                    {item.productName}
                  </h3>

                  <p>
                    Size: {item.size}
                  </p>

                  <p>
                    Quantity: {item.quantity}
                  </p>
                </div>

              </div>


              {/* CUSTOMER */}

              <div className="return-customer">

                <span>
                  CUSTOMER
                </span>

                <strong>
                  {item.customer?.firstName}{" "}
                  {item.customer?.lastName}
                </strong>

                <p>
                  {item.customer?.email}
                </p>

                <p>
                  {item.customer?.phone}
                </p>

              </div>


              {/* REASON */}

              <div className="return-reason">

                <span>
                  RETURN REASON
                </span>

                <strong>
                  {item.returnReason}
                </strong>

                {item.returnComment && (
                  <p>
                    {item.returnComment}
                  </p>
                )}

              </div>


              {/* STATUS */}

              <div className="return-status">

                <span>
                  STATUS
                </span>

                <strong
                  className={`return-status-${item.returnStatus}`}
                >
                  {item.returnStatus
                    ?.replaceAll(
                      "_",
                      " "
                    )
                    .toUpperCase()}
                </strong>

              </div>


              {/* ACTIONS */}

              <div className="return-actions">

                {item.returnStatus ===
                  "requested" && (
                  <>
                    <button
                      className="approve-return"
                      onClick={() =>
                        updateReturnStatus(
                          item.orderId,
                          item.itemId,
                          "approved"
                        )
                      }
                    >
                      ✓ APPROVE
                    </button>

                    <button
                      className="reject-return"
                      onClick={() =>
                        updateReturnStatus(
                          item.orderId,
                          item.itemId,
                          "rejected"
                        )
                      }
                    >
                      ✕ REJECT
                    </button>
                  </>
                )}

                {item.returnStatus ===
                  "approved" && (
                  <button
                    className="received-return"
                    onClick={() =>
                      updateReturnStatus(
                        item.orderId,
                        item.itemId,
                        "received"
                      )
                    }
                  >
                    ✓ MARK RECEIVED
                  </button>
                )}

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}

export default AdminReturns;