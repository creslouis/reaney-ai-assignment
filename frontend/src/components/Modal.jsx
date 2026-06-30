import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { apiFetch } from "../api";

export default function Modal() {
  const { lang, showModal, setShowModal, setAdminToken, setAdminRefreshToken, setAdminUser } = useApp();
  const t = T[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  if (!showModal) return null;

  const close = () => {
    setShowModal(null);
    setStatus({ msg: "", type: "" });
    setEmail(""); setPassword(""); setName("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: "", type: "" });
    try {
      const data = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAdminToken(data.access_token);
      setAdminRefreshToken(data.refresh_token || "");
      setAdminUser(data.user);
      setStatus({ msg: t.authLoginSuccess, type: "success" });
      setTimeout(close, 800);
    } catch (err) {
      setStatus({ msg: err.message || t.authEmailLoginError, type: "error" });
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: "", type: "" });
    try {
      const data = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: name || undefined }),
      });
      setAdminToken(data.access_token);
      setAdminRefreshToken(data.refresh_token || "");
      setAdminUser(data.user);
      setStatus({ msg: t.authRegisterSuccess, type: "success" });
      setTimeout(close, 800);
    } catch (err) {
      setStatus({ msg: err.message || t.authRegisterError, type: "error" });
    }
    setLoading(false);
  };

  let title = "";
  let body = null;

  if (showModal === "login") {
    title = t.modalLoginTitle || t.login;
    body = (
      <form onSubmit={handleLogin}>
        <input className="form-input" type="email" placeholder={t.authEmailPlaceholder || t.fieldEmail} value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" type="password" placeholder={t.authPasswordPlaceholder || t.fieldPassword} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: "1.25rem" }} />
        {status.msg && <div className={`experience-status ${status.type}`} style={{ marginBottom: "0.75rem" }}>{status.msg}</div>}
        <button type="submit" className="btn-submit" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>{loading ? "…" : (t.authLoginBtn || t.btnLogin)}</button>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "center", marginTop: "0.75rem" }}>
          {t.noAccount}{" "}
          <button type="button" onClick={() => setShowModal("register")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>
            {t.signupFree}
          </button>
        </p>
      </form>
    );
  } else if (showModal === "register" || showModal === "save") {
    const isSave = showModal === "save";
    title = isSave ? t.modalSaveTitle : (t.modalRegTitle || t.register);
    const sub = isSave ? t.modalSaveSub : t.modalRegSub;
    body = (
      <form onSubmit={isSave ? handleRegister : handleRegister}>
        <p style={{ fontSize: "0.83rem", color: "var(--muted)", marginBottom: "1rem" }}>{sub}</p>
        <input className="form-input" type="text" placeholder={t.authNamePlaceholder || t.fieldName} value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" type="email" placeholder={t.authEmailPlaceholder || t.fieldEmail} value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" type="password" placeholder={t.authPasswordPlaceholder || t.fieldNewPassword} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ marginBottom: "1.25rem" }} />
        {status.msg && <div className={`experience-status ${status.type}`} style={{ marginBottom: "0.75rem" }}>{status.msg}</div>}
        <button type="submit" className="btn-submit" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>{loading ? "…" : (t.authRegisterBtn || t.btnCreate)}</button>
      </form>
    );
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={close}>×</button>
        </div>
        {body}
      </div>
    </div>
  );
}
