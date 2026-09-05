import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="profile-page">

      {/* HEADER */}

      <section className="profile-header">

        <div className="profile-header-content">

          <p>MICKEY MOUSE • YOUR ACCOUNT</p>

          <h1>
            MY
            <br />
            PROFILE.
          </h1>

          <span>
            Manage your account and quickly access
            your orders, wishlist and shopping preferences.
          </span>

        </div>

        <div className="profile-header-mark">
          <span>MM</span>
        </div>

      </section>


      {/* PROFILE CONTENT */}

      <section className="profile-content">

        {/* ACCOUNT INFORMATION */}

        <div className="profile-card">

          <div className="profile-card-heading">
            <div>
              <span>ACCOUNT INFORMATION</span>
              <h2>YOUR DETAILS</h2>
            </div>

            <span>01</span>
          </div>


          <div className="profile-details">

            <div className="profile-detail">
              <span>NAME</span>
              <strong>
                {user?.name || "Customer"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>EMAIL ADDRESS</span>
              <strong>
                {user?.email || "Not available"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>ACCOUNT TYPE</span>
              <strong>
                {user?.role === "admin"
                  ? "Administrator"
                  : "Customer"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>ACCOUNT STATUS</span>
              <strong className="profile-active">
                ● ACTIVE
              </strong>
            </div>

          </div>

        </div>


        {/* QUICK ACTIONS */}

        <div className="profile-actions-section">

          <div className="profile-card-heading">
            <div>
              <span>QUICK ACCESS</span>
              <h2>YOUR STORE</h2>
            </div>

            <span>02</span>
          </div>


          <div className="profile-action-grid">

            <Link
              to="/my-orders"
              className="profile-action-card"
            >
              <span className="profile-action-number">
                01
              </span>

              <div>
                <span>ORDER HISTORY</span>
                <h3>MY ORDERS</h3>
                <p>
                  Track your purchases and view
                  order details.
                </p>
              </div>

              <strong>→</strong>
            </Link>


            <Link
              to="/wishlist"
              className="profile-action-card"
            >
              <span className="profile-action-number">
                02
              </span>

              <div>
                <span>YOUR SAVED ITEMS</span>
                <h3>WISHLIST</h3>
                <p>
                  View products you've saved
                  for later.
                </p>
              </div>

              <strong>→</strong>
            </Link>


            <Link
              to="/shop"
              className="profile-action-card"
            >
              <span className="profile-action-number">
                03
              </span>

              <div>
                <span>EXPLORE</span>
                <h3>SHOP COLLECTION</h3>
                <p>
                  Discover our latest clothing
                  collection.
                </p>
              </div>

              <strong>→</strong>
            </Link>


            <button
              className="profile-action-card profile-logout-card"
              onClick={handleLogout}
            >
              <span className="profile-action-number">
                04
              </span>

              <div>
                <span>ACCOUNT</span>
                <h3>LOG OUT</h3>
                <p>
                  Sign out of your Micky Mouse
                  account.
                </p>
              </div>

              <strong>→</strong>
            </button>

          </div>

        </div>


        {/* ADMIN ACCESS */}

        {user?.role === "admin" && (
          <div className="profile-admin-card">

            <div>
              <span>ADMINISTRATOR ACCESS</span>
              <h2>MANAGE STORE</h2>
              <p>
                You have administrator permissions
                for the Micky Mouse store.
              </p>
            </div>

            <Link to="/admin">
              OPEN ADMIN DASHBOARD →
            </Link>

          </div>
        )}


        {/* BOTTOM */}

        <div className="profile-bottom">

          <span>
            MICKEY MOUSE • WEAR YOUR CHARACTER.
          </span>

          <Link to="/shop">
            CONTINUE SHOPPING →
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Profile;