import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import GoogleAdminLogin from "../components/GoogleAdminLogin";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function CmsAdminPage() {
  const { lang, adminToken, adminUser, setAdminUser, adminRequest, logoutAdmin } = useApp();
  const t = T[lang];
  const [settings, setSettings] = useState([]);
  const [legal, setLegal] = useState([]);
  const [terms, setTerms] = useState(null);
  const [status, setStatus] = useState("");
  const [setup, setSetup] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loading, setLoading] = useState(false);

  const isAuthed = !!adminToken;

  const safeParseJson = (text, fallback) => {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  };

  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [me, cmsSettings, legalDocs, termsDoc] = await Promise.all([
        adminRequest("/api/v1/auth/me"),
        adminRequest("/api/v1/cms/admin/settings"),
        adminRequest("/api/v1/cms/admin/legal"),
        apiFetch("/api/v1/auth/legal/terms"),
      ]);
      setAdminUser(me);
      setSettings(cmsSettings);
      setLegal(legalDocs);
      setTerms(termsDoc);
    } catch {
      setStatus(t.authSessionError);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const updateSettingField = (id, value) => {
    setSettings((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const updateLegalField = (id, field, value) => {
    setLegal((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const updateObjectField = (id, objectKey, value) => {
    setSettings((prev) => prev.map((item) => (
      item.id === id ? { ...item, value: { ...item.value, [objectKey]: value } } : item
    )));
  };

  const saveSetting = async (item) => {
    try {
      await adminRequest(`/api/v1/cms/admin/settings/${item.key}`, {
        method: "PUT",
        body: JSON.stringify({
          category: item.category,
          label: item.label,
          value: item.value,
          value_type: item.value_type,
          is_public: item.is_public,
        }),
      });
      setStatus(t.cmsSaveSuccess);
    } catch {
      setStatus(t.cmsSaveError);
    }
  };

  const saveLegal = async (item) => {
    try {
      await adminRequest(`/api/v1/cms/admin/legal/${item.slug}`, {
        method: "PUT",
        body: JSON.stringify({
          title: item.title,
          content_markdown: item.content_markdown,
          version: item.version,
          is_active: item.is_active,
        }),
      });
      setStatus(t.cmsSaveSuccess);
    } catch {
      setStatus(t.cmsSaveError);
    }
  };

  const acceptTerms = async () => {
    try {
      await adminRequest("/api/v1/auth/accept-terms", { method: "POST", body: JSON.stringify({ accept: true }) });
      await loadAdminData();
      setStatus(t.cmsTermsAccepted);
    } catch {
      setStatus(t.cmsSaveError);
    }
  };

  const setupTwoFactor = async () => {
    try {
      const data = await adminRequest("/api/v1/auth/2fa/setup", { method: "POST" });
      setSetup(data);
      setStatus("");
    } catch {
      setStatus(t.cmsTwoFactorError);
    }
  };

  const enableTwoFactor = async () => {
    try {
      await adminRequest("/api/v1/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code: twoFactorCode }) });
      await loadAdminData();
      setSetup(null);
      setStatus(t.cmsTwoFactorEnabled);
    } catch {
      setStatus(t.cmsTwoFactorError);
    }
  };

  if (!isAuthed) {
    return (
      <main className="main">
        <div className="step-panel active">
          <GoogleAdminLogin />
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.cmsAdminTitle}</h2>
          <p className="sub">{t.cmsAdminSub}</p>
        </div>

        <div className="experience-card">
          <div className="admin-stats">
            <div className="meta-chip">{adminUser?.email}</div>
            <div className="meta-chip">2FA: {adminUser?.two_factor_enabled ? t.mlYes : t.mlNo}</div>
            <div className="meta-chip">Terms: {adminUser?.terms_accepted ? t.mlYes : t.mlNo}</div>
            {loading && <div className="meta-chip">{t.loadingTitle}</div>}
            <button className="btn-ghost" onClick={logoutAdmin}>{t.authLogout}</button>
          </div>

          {!!status && <div className={`experience-status ${status === t.cmsSaveSuccess || status === t.cmsTermsAccepted || status === t.cmsTwoFactorEnabled ? "success" : "error"}`}>{status}</div>}

          {!adminUser?.terms_accepted && terms && (
            <div className="summary-card">
              <div className="section-title">{terms.title}</div>
              <div className="why-text" style={{ whiteSpace: "pre-wrap" }}>{terms.content_markdown}</div>
              <div className="step-nav"><div /><button className="btn-submit" onClick={acceptTerms}>{t.cmsAcceptTerms}</button></div>
            </div>
          )}

          {!adminUser?.two_factor_enabled && (
            <div className="summary-card">
              <div className="section-title">{t.cmsTwoFactorTitle}</div>
              {!setup ? (
                <button className="btn-submit" onClick={setupTwoFactor}>{t.cmsSetupTwoFactor}</button>
              ) : (
                <>
                  <div className="why-text">{t.cmsTwoFactorHint}</div>
                  {setup.qr_code_data_url && <img src={setup.qr_code_data_url} alt="2FA QR" className="totp-qr" />}
                  <div className="why-text-kh" style={{ wordBreak: "break-all" }}>{setup.otpauth_url}</div>
                  <div className="admin-toolbar" style={{ marginTop: "1rem" }}>
                    <input className="form-input" placeholder={t.authTotpPlaceholder} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} />
                    <button className="btn-submit" onClick={enableTwoFactor}>{t.authVerifyTotp}</button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="section-title">{t.cmsSettingsTitle}</div>
          <div className="admin-list">
            {settings.map((item) => (
              <div className="summary-card" key={item.id}>
                <div className="section-title">{item.label}</div>
                <div className="why-text-kh">{item.key}</div>
                {item.value && typeof item.value === "object" && !Array.isArray(item.value) ? (
                  <div className="cms-object-grid">
                    {Object.entries(item.value).map(([objectKey, objectValue]) => (
                      <div key={objectKey} className="cms-object-field">
                        <label className="form-label">{objectKey}</label>
                        <input
                          className="form-input"
                          value={String(objectValue ?? "")}
                          onChange={(e) => updateObjectField(item.id, objectKey, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea className="form-input exp-textarea" value={JSON.stringify(item.value, null, 2)} onChange={(e) => {
                    updateSettingField(item.id, safeParseJson(e.target.value, item.value));
                  }} />
                )}
                <div className="step-nav"><div /><button className="btn-submit" onClick={() => saveSetting(item)}>{t.cmsSave}</button></div>
              </div>
            ))}
          </div>

          <div className="section-title" style={{ marginTop: "1rem" }}>{t.cmsLegalTitle}</div>
          <div className="admin-list">
            {legal.map((item) => (
              <div className="summary-card" key={item.id}>
                <input className="form-input" value={item.title} onChange={(e) => updateLegalField(item.id, "title", e.target.value)} style={{ marginBottom: "0.8rem" }} />
                <textarea className="form-input exp-textarea" value={item.content_markdown} onChange={(e) => updateLegalField(item.id, "content_markdown", e.target.value)} />
                <div className="step-nav"><div /><button className="btn-submit" onClick={() => saveLegal(item)}>{t.cmsSave}</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
