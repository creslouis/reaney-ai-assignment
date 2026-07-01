import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cmsSetting } from "../cms";

export function Topbar() {
  const { lang, setLang, step, setShowModal, results, cmsBundle, adminToken, adminUser, logoutAdmin } = useApp();
  const t = T[lang];
  const showSave = step === 6 && results.length > 0;
  const location = useLocation();
  const navigate = useNavigate();
  const branding = cmsSetting(cmsBundle, "branding.app", {});
  const navCms = cmsSetting(cmsBundle, "navigation.labels", {});
  const brandName = lang === "km" ? (branding.app_name_km || "រៀនអី") : (branding.app_name_en || "ReanEy");
  const brandIcon = branding.brand_icon || "🎓";

  const isAdmin = adminUser?.role === "admin";
  const isOnHome = location.pathname === "/";

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/");
  };

  return (
    <nav className="topbar">
      <div className="brand-wrap">
        <NavLink to="/" className="brand brand-link">
          <div className="brand-icon">{brandIcon}</div>
          <div className="brand-name">
            {brandName}
          </div>
        </NavLink>
        <div className="top-links">
          <NavLink to="/" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>
            {lang === "km" ? (navCms.student_km || t.navStudent) : (navCms.student_en || t.navStudent)}
          </NavLink>
          <NavLink to="/experience" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>
            {lang === "km" ? (navCms.experience_km || t.navExperience) : (navCms.experience_en || t.navExperience)}
          </NavLink>
          <NavLink to="/survey" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>
            {lang === "km" ? "ស្ទង់មតិ" : "Survey"}
          </NavLink>
          {/* Admin links – only visible when logged in as admin */}
          {isAdmin && (
            <>
              <NavLink to="/admin/experience" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navAdmin}</NavLink>
              <NavLink to="/admin/ml" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navModel}</NavLink>
              <NavLink to="/admin/universities" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navUniversity}</NavLink>
              <NavLink to="/admin/cms" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navCms}</NavLink>
            </>
          )}
        </div>
      </div>

      <div className="lang-toggle">
        <button
          className={`lang-btn${lang === "km" ? " active" : ""}`}
          onClick={() => setLang("km")}
        >ខ្មែរ</button>
        <button
          className={`lang-btn${lang === "en" ? " active" : ""}`}
          onClick={() => setLang("en")}
        >EN</button>
      </div>

      <div className="auth-links">
        {/* Show login/register only on home when not logged in */}
        {isOnHome && !adminToken && (
          <>
            <button className="btn-ghost" onClick={() => navigate("/login")}>{t.login}</button>
            <button className="btn-ghost" onClick={() => navigate("/login")}>{t.register}</button>
          </>
        )}
        {/* Save results */}
        {isOnHome && showSave && (
          <button className="btn-save show" onClick={() => setShowModal("save")}>{t.saveResults}</button>
        )}
        {/* Logged-in user info + logout */}
        {adminToken && (
          <div className="user-chip-wrap">
            {adminUser?.avatar_url && (
              <img src={adminUser.avatar_url} className="user-avatar" alt="avatar" />
            )}
            <span className="user-email-chip">{adminUser?.email}</span>
            <button className="btn-ghost" onClick={handleLogout}>{t.authLogout}</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export function ProgressBar() {
  const { lang, step } = useApp();
  const t = T[lang];

  const steps = [
    { n: 1, label: t.stepStrand },
    { n: 2, label: t.stepBacStatus },
    { n: 3, label: t.stepGrades },
    { n: 4, label: t.stepInterests },
    { n: 5, label: t.stepPrefs },
    { n: 6, label: t.stepResults, dot: "✓" },
  ];

  const activeStep = step === "loading" ? 6 : step;

  return (
    <div className="progress-bar">
      <div className="steps">
        {steps.map((s) => {
          const isDone = activeStep > s.n;
          const isActive = activeStep === s.n;
          return (
            <div key={s.n} className={`step-item${isActive ? " active" : ""}${isDone ? " done" : ""}`}>
              <div className="step-dot">{isDone ? "✓" : s.dot || s.n}</div>
              <div className="step-label">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
