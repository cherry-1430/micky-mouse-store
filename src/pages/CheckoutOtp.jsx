import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/apiConfig";

function CheckoutOTP({ phone, setPhone, onVerified }) {
  const { login } = useAuth();

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // SEND OTP
  // =========================================================

  const sendOTP = async () => {
    const cleanPhone = String(phone || "")
      .replace(/\D/g, "")
      .slice(0, 10);

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        "Enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      console.log(
        "Sending OTP to:",
        cleanPhone
      );

      console.log(
        "OTP API:",
        `${API_URL}/api/auth/send-otp`
      );

      const response = await fetch(
        `${API_URL}/api/auth/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone: cleanPhone,
          }),
        }
      );

      // -------------------------------------------------------
      // READ RESPONSE SAFELY
      // -------------------------------------------------------

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Non-JSON OTP response:",
          text
        );

        throw new Error(
          `Server returned ${response.status} instead of JSON. Check API URL/backend.`
        );
      }

      console.log(
        "Send OTP response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send OTP"
        );
      }

      setPhone(cleanPhone);
      setOtpSent(true);

      setMessage(
        data.message ||
          "OTP sent successfully."
      );

      setError("");
    } catch (err) {
      console.error(
        "Send OTP error:",
        err
      );

      setError(
        err.message ||
          "Failed to send OTP"
      );

      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const verifyOTP = async () => {
    const cleanOTP = String(otp || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!/^\d{6}$/.test(cleanOTP)) {
      setError(
        "Enter the 6-digit OTP."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      console.log(
        "Verifying OTP for:",
        phone
      );

      console.log(
        "Verify OTP API:",
        `${API_URL}/api/auth/verify-otp`
      );

      const response = await fetch(
        `${API_URL}/api/auth/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone,
            otp: cleanOTP,
          }),
        }
      );

      // -------------------------------------------------------
      // READ RESPONSE SAFELY
      // -------------------------------------------------------

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Non-JSON verify response:",
          text
        );

        throw new Error(
          `Server returned ${response.status} instead of JSON. Check API URL/backend.`
        );
      }

      console.log(
        "Verify OTP response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "OTP verification failed"
        );
      }

      // -------------------------------------------------------
      // SAVE USER + JWT
      // -------------------------------------------------------

      if (
        data.user &&
        data.token
      ) {
        login(
          data.user,
          data.token
        );
      }

      // -------------------------------------------------------
      // VERIFIED
      // -------------------------------------------------------

      setMessage(
        "Mobile number verified successfully."
      );

      setError("");

      if (onVerified) {
        onVerified(data.user);
      }
    } catch (err) {
      console.error(
        "Verify OTP error:",
        err
      );

      setError(
        err.message ||
          "OTP verification failed"
      );

      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CHANGE PHONE NUMBER
  // =========================================================

  const changePhone = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
    setMessage("");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="checkout-otp">

      <label htmlFor="checkout-phone">
        PHONE NUMBER
      </label>

      {/* =====================================================
          PHONE INPUT
      ====================================================== */}

      <div className="checkout-otp-phone-row">

        <input
          id="checkout-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Enter 10-digit mobile number"
          value={phone || ""}
          onChange={(e) => {
            const value =
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 10);

            setPhone(value);
          }}
          maxLength={10}
          disabled={
            loading || otpSent
          }
          required
        />

        {!otpSent && (
          <button
            type="button"
            onClick={sendOTP}
            disabled={
              loading
            }
          >
            {loading
              ? "SENDING..."
              : "SEND OTP"}
          </button>
        )}

      </div>

      {/* =====================================================
          OTP SECTION
      ====================================================== */}

      {otpSent && (
        <div className="checkout-otp-verify">

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value =
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

              setOtp(value);
            }}
            maxLength={6}
            disabled={loading}
          />

          <button
            type="button"
            onClick={verifyOTP}
            disabled={loading}
          >
            {loading
              ? "VERIFYING..."
              : "VERIFY OTP"}
          </button>

          <button
            type="button"
            className="checkout-otp-resend"
            onClick={sendOTP}
            disabled={loading}
          >
            RESEND OTP
          </button>

          <button
            type="button"
            className="checkout-otp-change"
            onClick={changePhone}
            disabled={loading}
          >
            CHANGE NUMBER
          </button>

        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && (
        <p className="checkout-otp-success">
          {message}
        </p>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <p className="checkout-otp-error">
          {error}
        </p>
      )}

    </div>
  );
}

export default CheckoutOTP;