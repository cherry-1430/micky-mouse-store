import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/apiConfig";

import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ================================
// SAVED ADDRESSES
// ================================

const [addresses, setAddresses] = useState([]);
const [addressLoading, setAddressLoading] = useState(true);
const [addressSaving, setAddressSaving] = useState(false);
const [addressEditing, setAddressEditing] = useState(null);
const [showAddressForm, setShowAddressForm] = useState(false);

const [addressForm, setAddressForm] = useState({
  label: "",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
});

  // ================================
  // FETCH PROFILE
  // ================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch profile"
          );
        }

        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ================================
// FETCH SAVED ADDRESSES
// ================================

useEffect(() => {
  const fetchAddresses = async () => {
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
          data.message || "Failed to fetch addresses"
        );
      }

      setAddresses(data);
    } catch (error) {
      console.error("Address fetch error:", error);
    } finally {
      setAddressLoading(false);
    }
  };

  fetchAddresses();
}, []);



  // ================================
  // LOGOUT
  // ================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ================================
  // SAVE PROFILE
  // ================================

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/users/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setProfile(data.user || data);

      setName(data.user?.name || data.name || "");
      setPhone(data.user?.phone || data.phone || "");

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ================================
// ADDRESS FORM CHANGE
// ================================

const handleAddressChange = (e) => {
  const { name, value, type, checked } = e.target;

  setAddressForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

// ================================
// RESET ADDRESS FORM
// ================================

const resetAddressForm = () => {
  setAddressForm({
    label: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  setAddressEditing(null);
  setShowAddressForm(false);
};

// ================================
// ADD / UPDATE ADDRESS
// ================================

const handleSaveAddress = async (e) => {
  e.preventDefault();

  try {
    setAddressSaving(true);
    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    const url = addressEditing
      ? `${API_URL}/api/users/addresses/${addressEditing}`
      : `${API_URL}/api/users/addresses`;

    const method = addressEditing ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addressForm),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to save address"
      );
    }

    setAddresses(data.addresses || []);

    setMessage(
      addressEditing
        ? "Address updated successfully."
        : "Address added successfully."
    );

    resetAddressForm();
  } catch (error) {
    console.error("Address save error:", error);
    setError(error.message);
  } finally {
    setAddressSaving(false);
  }
};

// ================================
// EDIT ADDRESS
// ================================

const handleEditAddress = (address) => {
  setAddressEditing(address._id);

  setAddressForm({
    label: address.label || "",
    fullName: address.fullName || "",
    phone: address.phone || "",
    address: address.address || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    isDefault: address.isDefault || false,
  });

  setShowAddressForm(true);

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

// ================================
// DELETE ADDRESS
// ================================

const handleDeleteAddress = async (addressId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this address?"
  );

  if (!confirmed) return;

  try {
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/users/addresses/${addressId}`,
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
        data.message || "Failed to delete address"
      );
    }

    setAddresses(data.addresses || []);
    setMessage("Address deleted successfully.");
  } catch (error) {
    console.error("Address delete error:", error);
    setError(error.message);
  }
};

// ================================
// SET DEFAULT ADDRESS
// ================================

const handleSetDefaultAddress = async (address) => {
  try {
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/users/addresses/${address._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isDefault: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to set default address"
      );
    }

    setAddresses(data.addresses || []);
    setMessage("Default address updated.");
  } catch (error) {
    console.error("Default address error:", error);
    setError(error.message);
  }
};

  // ================================
  // LOADING
  // ================================

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <span>MICKEY MOUSE • YOUR ACCOUNT</span>
          <h1>Loading Profile...</h1>
        </div>
      </main>
    );
  }

  // ================================
  // ERROR
  // ================================

  if (error && !profile) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          <span>ACCOUNT • ERROR</span>
          <h1>Unable to Load Profile</h1>
          <p>{error}</p>

          <Link to="/" className="profile-back-button">
            ← BACK TO HOME
          </Link>
        </div>
      </main>
    );
  }

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


          {/* PROFILE DETAILS */}

          <div className="profile-details">

            {/* NAME */}

            <div className="profile-detail">

              <span>NAME</span>

              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="profile-edit-input"
                  placeholder="Enter your name"
                />
              ) : (
                <strong>
                  {profile?.name || "Customer"}
                </strong>
              )}

            </div>


            {/* EMAIL */}

            <div className="profile-detail">

              <span>EMAIL ADDRESS</span>

              <strong>
                {profile?.email ||
                  user?.email ||
                  "Not available"}
              </strong>

              {editing && (
                <small>
                  Email cannot be changed.
                </small>
              )}

            </div>


            {/* PHONE */}

            <div className="profile-detail">

              <span>PHONE NUMBER</span>

              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="profile-edit-input"
                  placeholder="Enter phone number"
                />
              ) : (
                <strong>
                  {profile?.phone || "Not added"}
                </strong>
              )}

            </div>


            {/* ACCOUNT TYPE */}

            <div className="profile-detail">

              <span>ACCOUNT TYPE</span>

              <strong>
                {profile?.role === "admin"
                  ? "Administrator"
                  : "Customer"}
              </strong>

            </div>


            {/* ACCOUNT STATUS */}

            <div className="profile-detail">

              <span>ACCOUNT STATUS</span>

              <strong className="profile-active">
                ● ACTIVE
              </strong>

            </div>

          </div>


          {/* EDIT / SAVE */}

          <div className="profile-edit-actions">

            {!editing ? (

              <button
                type="button"
                className="profile-edit-button"
                onClick={() => {
                  setEditing(true);
                  setMessage("");
                  setError("");
                }}
              >
                EDIT PROFILE →
              </button>

            ) : (

              <>
                <button
                  type="button"
                  className="profile-save-button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : "SAVE CHANGES →"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.name || "");
                    setPhone(profile?.phone || "");
                    setMessage("");
                    setError("");
                  }}
                  disabled={saving}
                >
                  CANCEL
                </button>
              </>

            )}

          </div>


          {/* MESSAGES */}

          {message && (
            <p className="profile-success-message">
              ✓ {message}
            </p>
          )}

          {error && (
            <p className="profile-error-message">
              {error}
            </p>
          )}

        </div>


        {/* QUICK ACTIONS */}

{/* ================================
    SAVED ADDRESSES
================================ */}

<div className="profile-address-section">

  <div className="profile-card-heading">
    <div>
      <span>DELIVERY INFORMATION</span>
      <h2>SAVED ADDRESSES</h2>
    </div>

    <span>02</span>
  </div>

  {addressLoading ? (
    <div className="profile-address-loading">
      Loading saved addresses...
    </div>
  ) : (
    <>
      {/* SAVED ADDRESS CARDS */}

      {addresses.length > 0 ? (
        <div className="profile-address-grid">

          {addresses.map((address) => (
            <div
              key={address._id}
              className={`profile-address-card ${
                address.isDefault
                  ? "profile-address-default"
                  : ""
              }`}
            >

              <div className="profile-address-top">

                <div>
                  <span className="profile-address-label">
                    {address.label}
                  </span>

                  {address.isDefault && (
                    <span className="profile-default-badge">
                      DEFAULT
                    </span>
                  )}
                </div>

                <span className="profile-address-icon">
                  {address.isDefault ? "★" : "○"}
                </span>

              </div>

              <div className="profile-address-info">

                <strong>
                  {address.fullName}
                </strong>

                <p>
                  {address.phone}
                </p>

                <p>
                  {address.address}
                </p>

                <p>
                  {address.city}, {address.state}
                </p>

                <p>
                  PINCODE: {address.pincode}
                </p>

              </div>

              <div className="profile-address-actions">

                <button
                  type="button"
                  onClick={() =>
                    handleEditAddress(address)
                  }
                >
                  EDIT
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteAddress(address._id)
                  }
                >
                  DELETE
                </button>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSetDefaultAddress(address)
                    }
                  >
                    SET DEFAULT
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      ) : (
        <div className="profile-no-address">
          <span>NO SAVED ADDRESSES</span>

          <p>
            Add your delivery address for a faster
            checkout experience.
          </p>
        </div>
      )}

      {/* ADD ADDRESS BUTTON */}

      {!showAddressForm && (
        <button
          type="button"
          className="profile-add-address-button"
          onClick={() => {
            setAddressEditing(null);
            setAddressForm({
              label: "",
              fullName: "",
              phone: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              isDefault: addresses.length === 0,
            });
            setShowAddressForm(true);
            setMessage("");
            setError("");
          }}
        >
          + ADD NEW ADDRESS
        </button>
      )}

      {/* ADDRESS FORM */}

      {showAddressForm && (
        <form
          className="profile-address-form"
          onSubmit={handleSaveAddress}
        >

          <div className="profile-address-form-heading">
            <div>
              <span>
                {addressEditing
                  ? "EDIT SAVED ADDRESS"
                  : "NEW DELIVERY ADDRESS"}
              </span>

              <h3>
                {addressEditing
                  ? "UPDATE ADDRESS"
                  : "ADD ADDRESS"}
              </h3>
            </div>
          </div>

          <div className="profile-address-form-grid">

            <div className="profile-form-field">
              <label>LABEL</label>

              <input
                type="text"
                name="label"
                value={addressForm.label}
                onChange={handleAddressChange}
                placeholder="Home / Work"
                required
              />
            </div>

            <div className="profile-form-field">
              <label>FULL NAME</label>

              <input
                type="text"
                name="fullName"
                value={addressForm.fullName}
                onChange={handleAddressChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="profile-form-field">
              <label>PHONE</label>

              <input
                type="tel"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressChange}
                placeholder="Phone number"
                required
              />
            </div>

            <div className="profile-form-field">
              <label>PINCODE</label>

              <input
                type="text"
                name="pincode"
                value={addressForm.pincode}
                onChange={handleAddressChange}
                placeholder="Pincode"
                required
              />
            </div>

            <div className="profile-form-field profile-form-full">
              <label>ADDRESS</label>

              <textarea
                name="address"
                value={addressForm.address}
                onChange={handleAddressChange}
                placeholder="House / Street / Area"
                rows="3"
                required
              />
            </div>

            <div className="profile-form-field">
              <label>CITY</label>

              <input
                type="text"
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                placeholder="City"
                required
              />
            </div>

            <div className="profile-form-field">
              <label>STATE</label>

              <input
                type="text"
                name="state"
                value={addressForm.state}
                onChange={handleAddressChange}
                placeholder="State"
                required
              />
            </div>

          </div>

          <label className="profile-default-checkbox">
            <input
              type="checkbox"
              name="isDefault"
              checked={addressForm.isDefault}
              onChange={handleAddressChange}
            />

            <span>
              Make this my default delivery address
            </span>
          </label>

          <div className="profile-address-form-actions">

            <button
              type="submit"
              className="profile-save-address-button"
              disabled={addressSaving}
            >
              {addressSaving
                ? "SAVING..."
                : addressEditing
                ? "UPDATE ADDRESS →"
                : "SAVE ADDRESS →"}
            </button>

            <button
              type="button"
              className="profile-cancel-address-button"
              onClick={resetAddressForm}
              disabled={addressSaving}
            >
              CANCEL
            </button>

          </div>

        </form>
      )}
    </>
  )}

</div>


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

        {profile?.role === "admin" && (
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