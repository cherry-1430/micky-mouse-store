import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/apiConfig";

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
        throw new Error(
          data.message || "Login failed"
        );
      }

      // Save login information
      login(data.user, data.token);

      /*
      If the customer was redirected to Login
      from another protected page, return them
      to that page.

      Otherwise go to Home.
      */

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
    <div className="page-container">
      <h1>Login</h1>

      {error && (
        <p className="login-error">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "LOGGING IN..."
            : "LOGIN"}
        </button>
      </form>

      <p>
        Don't have an account?{" "}
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
          REGISTER
        </button>
      </p>
    </div>
  );
}

export default Login;