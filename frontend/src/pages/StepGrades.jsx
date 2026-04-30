import { useApp } from "../context/AppContext";
import { T, SUBJECTS } from "../data/translations";

const GRADES = ["A", "B", "C", "D", "E", "F"];

export default function StepGrades() {
  const { lang, strand, bacStatus, grades, setGrade, strongSubjects, toggleStrongSubject, setStep } = useApp();
  const t = T[lang];
  const subjects = SUBJECTS[strand] || [];
  const isPreBac = bacStatus === "not_yet";

  if (isPreBac) {
    return (
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.s2PreTitle}</h2>
          <p className="sub">{t.s2PreSub}</p>
        </div>

        {/* Hint badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          background: "var(--gold-light)", border: "1px solid rgba(212,160,23,0.3)",
          borderRadius: "20px", padding: "0.4rem 0.9rem",
          fontSize: "0.78rem", color: "#7a5c00", marginBottom: "1.25rem",
          fontWeight: 500,
        }}>
          💡 {t.s2PreHint}
        </div>

        <div className="tag-cloud" style={{ marginBottom: "1.5rem" }}>
          {subjects.map((sub) => {
            const selected = strongSubjects.includes(sub.id);
            return (
              <span
                key={sub.id}
                className={`interest-tag${selected ? " selected" : ""}`}
                style={{ fontSize: "0.88rem", padding: "0.55rem 1.1rem" }}
                onClick={() => toggleStrongSubject(sub.id)}
              >
                {selected ? "✓ " : ""}
                {lang === "km" ? sub.km : sub.en}
              </span>
            );
          })}
        </div>

        <div className="step-nav">
          <button className="btn-back" onClick={() => setStep(2)}>← {t.back}</button>
          <button className="btn-next" onClick={() => setStep(4)}>
            {t.nextInterests} →
          </button>
        </div>
      </div>
    );
  }

  // Post-bac: A–F grade table
  return (
    <div className="step-panel active">
      <div className="step-heading">
        <h2>{t.s2Title}</h2>
        <p className="sub">{t.s2Sub}</p>
      </div>

      <div className="grade-table">
        <div className="grade-table-header">
          <span>{t.colSubject}</span>
          <span>{t.colGrade}</span>
        </div>
        {subjects.map((sub) => (
          <div className="grade-row" key={sub.id}>
            <div>
              <div className="subject-name">{lang === "km" ? sub.km : sub.en}</div>
              {lang === "en" && <div className="subject-kh">{sub.km}</div>}
            </div>
            <div className="grade-select">
              {GRADES.map((g) => (
                <button
                  key={g}
                  className={`grade-btn${grades[sub.id] === g ? ` sel-${g}` : ""}`}
                  onClick={() => setGrade(sub.id, g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="step-nav">
        <button className="btn-back" onClick={() => setStep(2)}>← {t.back}</button>
        <button className="btn-next" onClick={() => setStep(4)}>{t.nextInterests} →</button>
      </div>
    </div>
  );
}
