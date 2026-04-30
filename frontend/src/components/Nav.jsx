import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export function Topbar() {
  const { lang, setLang, step, setShowModal, results } = useApp();
  const t = T[lang];
  const showSave = step === 5 && results.length > 0;

  return (
    <nav className="topbar">
      <div className="brand">
        <div className="brand-icon">🎓</div>
        <div className="brand-name">
          {lang === "km" ? "រៀន" : "Rean"}<span>{lang === "km" ? "អី" : "Ey"}</span>
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
        <button className="btn-ghost" onClick={() => setShowModal("login")}>{t.login}</button>
        <button className="btn-ghost" onClick={() => setShowModal("register")}>{t.register}</button>
        {showSave && (
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
    { n: 2, label: t.stepGrades },
    { n: 3, label: t.stepInterests },
    { n: 4, label: t.stepPrefs },
    { n: 5, label: t.stepResults, dot: "✓" },
  ];

  const activeStep = step === "loading" ? 5 : step;

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
