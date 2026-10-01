import { useState } from "react";
import {
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";

import API_URL from "../api/apiConfig";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath =
    location.state?.from || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      alert("Account created successfully!");

      navigate("/login", {
        state: {
          from: redirectPath,
        },
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-container">

        {/* LEFT SIDE */}

        <section className="auth-brand-panel register-brand">

          <Link to="/" className="auth-logo">
            SPACE<span>WEAR</span>
          </Link>

          <div className="auth-brand-content">

            <span>SPACE WEAR • NEW MEMBERS</span>

            <h1>
              JOIN THE
              <br />
              <strong>COLLECTION.</strong>
            </h1>

            <p>
              Create your Space Wear account and
              discover premium clothing designed
              for comfort and confidence.
            </p>

          </div>

          <div className="auth-brand-footer">
            <span>PREMIUM</span>
            <span>ORIGINAL</span>
            <span>COMFORT</span>
          </div>

        </section>


        {/* RIGHT SIDE */}

        <section className="auth-form-panel">

          <div className="auth-form-wrapper">

            <div className="auth-heading">

              <span>CREATE YOUR ACCOUNT</span>

              <h2>REGISTER</h2>

              <p>
                Join Space Wear and start your journey.
              </p>

            </div>


            {error && (
              <div className="auth-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}


            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              <div className="auth-field">

                <label htmlFor="register-name">
                  FULL NAME
                </label>

                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />

              </div>


              <div className="auth-field">

                <label htmlFor="register-email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

              </div>


              <div className="auth-field">

                <label htmlFor="register-password">
                  PASSWORD
                </label>

                <div className="password-wrapper">

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                  >
                    {showPassword
                      ? "HIDE"
                      : "SHOW"}
                  </button>

                </div>

              </div>


              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    CREATING ACCOUNT...
                  </>
                ) : (
                  <>
                    CREATE ACCOUNT
                    <span>→</span>
                  </>
                )}

              </button>

            </form>


            <div className="auth-switch">

              <span>
                ALREADY HAVE AN ACCOUNT?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/login", {
                    state: {
                      from: redirectPath,
                    },
                  })
                }
              >
                LOGIN →
              </button>

            </div>


            <Link
              to="/"
              className="auth-back-home"
            >
              ← BACK TO SPACE WEAR
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}

export default Register;