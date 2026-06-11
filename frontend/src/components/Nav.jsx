import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { NavLink, useLocation } from "react-router-dom";
import { cmsSetting } from "../cms";

export function Topbar() {
  const { lang, setLang, step, setShowModal, results, cmsBundle } = useApp();
  const t = T[lang];
  const showSave = step === 6 && results.length > 0;
  const location = useLocation();
  const branding = cmsSetting(cmsBundle, "branding.app", {});
  const navCms = cmsSetting(cmsBundle, "navigation.labels", {});
  const brandName = lang === "km" ? (branding.app_name_km || "រៀនអី") : (branding.app_name_en || "ReanEy");
  const brandIcon = branding.brand_icon || "🎓";

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
        <NavLink to="/" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{lang === "km" ? (navCms.student_km || t.navStudent) : (navCms.student_en || t.navStudent)}</NavLink>
        <NavLink to="/experience" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{lang === "km" ? (navCms.experience_km || t.navExperience) : (navCms.experience_en || t.navExperience)}</NavLink>
        <NavLink to="/admin/experience" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navAdmin}</NavLink>
        <NavLink to="/admin/ml" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navModel}</NavLink>
        <NavLink to="/admin/universities" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navUniversity}</NavLink>
        <NavLink to="/admin/cms" className={({ isActive }) => `top-link${isActive ? " active" : ""}`}>{t.navCms}</NavLink>
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
        {location.pathname === "/" && <button className="btn-ghost" onClick={() => setShowModal("login")}>{t.login}</button>}
        {location.pathname === "/" && <button className="btn-ghost" onClick={() => setShowModal("register")}>{t.register}</button>}
        {location.pathname === "/" && showSave && (
          <button className="btn-save show" onClick={() => setShowModal("save")}>{t.saveResults}</button>
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
