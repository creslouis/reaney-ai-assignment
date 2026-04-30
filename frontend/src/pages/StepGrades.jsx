import { useApp } from "../context/AppContext";
import { T, SUBJECTS } from "../data/translations";

const GRADES = ["A", "B", "C", "D", "E", "F"];

export default function StepGrades() {
  const { lang, strand, grades, setGrade, setStep } = useApp();
  const t = T[lang];
  const subjects = SUBJECTS[strand] || [];

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
        <button className="btn-back" onClick={() => setStep(1)}>← {t.back}</button>
        <button className="btn-next" onClick={() => setStep(3)}>{t.nextInterests} →</button>
      </div>
    </div>
  );
}
