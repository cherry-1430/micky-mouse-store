import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/apiConfig";
import "./Auth.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
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
        throw new Error(data.message || "Login failed");
      }

      login(data.user, data.token);

      const redirectPath =
        location.state?.from || "/";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-container">

        {/* LEFT SIDE */}

        <section className="auth-brand-panel">

          <Link to="/" className="auth-logo">
            SPACE<span>WEAR</span>
          </Link>

          <div className="auth-brand-content">

            <span>SPACE WEAR • MEMBERS</span>

            <h1>
              WELCOME
              <br />
              <strong>BACK.</strong>
            </h1>

            <p>
              Sign in to continue exploring your
              favourite styles and manage your
              Space Wear collection.
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

              <span>ACCOUNT ACCESS</span>

              <h2>LOGIN</h2>

              <p>
                Enter your details to access your account.
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

                <label htmlFor="login-email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="login-email"
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

                <label htmlFor="login-password">
                  PASSWORD
                </label>

                <div className="password-wrapper">

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
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
                    LOGGING IN...
                  </>
                ) : (
                  <>
                    LOGIN
                    <span>→</span>
                  </>
                )}

              </button>

            </form>


            <div className="auth-switch">

              <span>
                DON'T HAVE AN ACCOUNT?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/register", {
                    state: {
                      from:
                        location.state?.from || "/",
                    },
                  })
                }
              >
                CREATE ACCOUNT →
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

export default Login;