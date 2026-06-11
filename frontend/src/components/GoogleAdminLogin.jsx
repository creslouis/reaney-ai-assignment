import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleAdminLogin() {
  const { lang, setAdminToken, setAdminRefreshToken, setAdminUser } = useApp();
  const t = T[lang];
  const buttonRef = useRef(null);
  const [status, setStatus] = useState("");
  const [pendingCredential, setPendingCredential] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const loginWithCredential = async (credential, code = "") => {
    try {
      const data = await apiFetch("/api/v1/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ id_token: credential, totp_code: code || null }),
      });
      if (data.requires_2fa_verify) {
        setPendingCredential(credential);
        setStatus(t.authEnterTotp);
        return;
      }
      if (data.access_token) {
        setAdminToken(data.access_token);
        setAdminRefreshToken(data.refresh_token || "");
        setAdminUser(data.user);
        setStatus(t.authLoginSuccess);
      }
    } catch {
      setStatus(t.authLoginError);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => loginWithCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
      });
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="experience-card">
      <div className="step-heading" style={{ marginBottom: "1rem" }}>
        <h2>{t.authAdminTitle}</h2>
        <p className="sub">{t.authAdminSub}</p>
      </div>
      <div ref={buttonRef} />
      {!!pendingCredential && (
        <div className="admin-toolbar" style={{ marginTop: "1rem" }}>
          <input className="form-input" placeholder={t.authTotpPlaceholder} value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
          <button className="btn-submit" onClick={() => loginWithCredential(pendingCredential, totpCode)}>{t.authVerifyTotp}</button>
        </div>
      )}
      {status && <div className={`experience-status ${status === t.authLoginSuccess ? "success" : "error"}`}>{status}</div>}
    </div>
  );
}
