import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const { lang, adminToken, setAdminToken, setAdminRefreshToken, setAdminUser } = useApp();
  const t = T[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);

  // Redirect if already authed
  useEffect(() => {
    if (adminToken) {
      navigate(from, { replace: true });
    }
  }, [adminToken, from, navigate]);

  // Initialise Google Sign-In button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;
    let script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        width: 320,
        text: "signin_with",
      });
    };
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCredential = async (response) => {
    setLoading(true);
    setStatus({ msg: "", type: "" });
    try {
      const data = await apiFetch("/api/v1/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ id_token: response.credential }),
      });
      if (data.access_token) {
        setAdminToken(data.access_token);
        setAdminRefreshToken(data.refresh_token || "");
        setAdminUser(data.user);
        setStatus({ msg: t.authLoginSuccess, type: "success" });
        navigate(data.user?.role === "admin" ? "/admin/cms" : "/", { replace: true });
      }
    } catch (e) {
      setStatus({ msg: e.message || t.authLoginError, type: "error" });
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: "", type: "" });
    try {
      let data;
      if (mode === "login") {
        data = await apiFetch("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      } else {
        data = await apiFetch("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, full_name: name || undefined }),
        });
        setStatus({ msg: t.authRegisterSuccess, type: "success" });
      }
      setAdminToken(data.access_token);
      setAdminRefreshToken(data.refresh_token || "");
      setAdminUser(data.user);
      navigate(data.user?.role === "admin" ? "/admin/cms" : "/", { replace: true });
    } catch (e) {
      setStatus({
        msg: e.message || (mode === "login" ? t.authEmailLoginError : t.authRegisterError),
        type: "error",
      });
    }
    setLoading(false);
  };

  return (
    <main className="main login-page-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-card-header">
          <div className="brand-icon" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
          <h1 className="login-title">
            {mode === "login" ? t.login : t.register}
          </h1>
          <p className="login-subtitle">
            {mode === "login" ? t.authAdminLoginSub : t.modalRegSub || "Join and get personalised university picks."}
          </p>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleEmailSubmit} className="login-form">
          {mode === "register" && (
            <input
              className="form-input"
              type="text"
              placeholder={t.authNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="form-input"
            type="email"
            placeholder={t.authEmailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder={t.authPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 8 : undefined}
              style={{ paddingRight: "3rem" }}
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                padding: "0.25rem 0.5rem",
                minWidth: "auto",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {status.msg && (
            <div className={`experience-status ${status.type}`} style={{ marginBottom: "0.5rem" }}>
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit login-submit-btn"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "…" : (mode === "login" ? t.authLoginBtn : t.authRegisterBtn)}
          </button>
        </form>

        {/* Switch mode */}
        <p className="login-switch">
          <button
            className="link-btn"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setStatus({ msg: "", type: "" }); }}
          >
            {mode === "login" ? t.authSwitchToRegister : t.authSwitchToLogin}
          </button>
        </p>

        {/* Divider */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div className="login-divider">
              <span>{t.authOrContinueWith}</span>
            </div>
            {/* Google Sign-In button rendered by GSI */}
            <div className="google-btn-wrapper" ref={googleBtnRef} />
          </>
        )}
      </div>
    </main>
  );
}
