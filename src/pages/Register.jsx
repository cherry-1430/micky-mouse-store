import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import API_URL from "../api/apiConfig";

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

  // Remember where the customer originally wanted to go
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

      /*
       * After registration, go to Login.
       * Pass the original destination so that
       * Login can send the customer there
       * after successful login.
       */
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
    <div className="page-container">
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

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

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "CREATING ACCOUNT..."
            : "CREATE ACCOUNT"}
        </button>
      </form>

      <p>
        Already have an account?{" "}
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
          LOGIN
        </button>
      </p>
    </div>
  );
}

export default Register;