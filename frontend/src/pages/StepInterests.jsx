import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function StepInterests() {
  const { lang, interests, toggleInterest, setStep } = useApp();
  const t = T[lang];

  return (
    <div className="step-panel active">
      <div className="step-heading">
        <h2>{t.s3Title}</h2>
        <p className="sub">{t.s3Sub}</p>
      </div>

      <div className="tag-cloud">
        {t.interests.map((item) => (
          <span
            key={item.val}
            className={`interest-tag${interests.includes(item.val) ? " selected" : ""}`}
            onClick={() => toggleInterest(item.val)}
          >
            {item.label}
          </span>
        ))}
      </div>

      <div className="step-nav">
        <button className="btn-back" onClick={() => setStep(2)}>← {t.back}</button>
        <button className="btn-next" onClick={() => setStep(4)}>{t.nextPrefs} →</button>
      </div>
    </div>
  );
}
