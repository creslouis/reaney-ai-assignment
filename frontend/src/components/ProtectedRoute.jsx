import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

/**
 * ProtectedRoute – wraps admin-only routes.
 *
 * Props:
 *   requiredRole: "admin" | "user" (default "admin")
 *   children: the protected page element
 *
 * Behaviour:
 *   - No token → redirect to /login (and remember where they were)
 *   - Token present but wrong role → show an "Access Denied" screen
 *   - Token + correct role → render children
 */
export default function ProtectedRoute({ children, requiredRole = "admin" }) {
  const { adminToken, adminUser, lang } = useApp();
  const location = useLocation();
  const t = T[lang];

  // Not logged in – send to /login, preserving intended destination
  if (!adminToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Logged in but role doesn't match
  if (adminUser && adminUser.role !== requiredRole) {
    return (
      <main className="main">
        <div className="step-panel active" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚫</div>
          <h2 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>{t.authAccessDenied}</h2>
          <p className="sub" style={{ marginBottom: "1.5rem" }}>{t.authAccessDeniedSub}</p>
          <Navigate to="/" replace />
        </div>
      </main>
    );
  }

  // If adminUser not loaded yet (token exists but profile not fetched) – optimistically render
  // The individual pages handle the "not authed" state themselves via adminToken check.
  return children;
}
