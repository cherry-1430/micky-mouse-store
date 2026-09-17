import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isLoggedIn } = useAuth();

  // =====================================================
  // ADMIN ROUTES
  // =====================================================

  if (adminOnly) {
   if (!isLoggedIn) {
  return (
    <Navigate
      to="/login"
      state={{ from: window.location.pathname }}
      replace
    />
  );
}

    if (user?.role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return children;
  }

  // =====================================================
  // NORMAL USER ROUTES
  // =====================================================
  //
  // Login/Register are no longer required here.
  // The customer will be verified through MSG91 OTP
  // during checkout before placing an order.
  //

  return children;
}

export default ProtectedRoute;