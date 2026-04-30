import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function StepBacStatus() {
  const { lang, bacStatus, setBacStatus, setStep } = useApp();
  const t = T[lang];

  const options = [
    {
      id: "done",
      emoji: "🎓",
      label: t.bacDone,
      sub: t.bacDoneSub,
    },
    {
      id: "not_yet",
      emoji: "📚",
      label: t.bacNotYet,
      sub: t.bacNotYetSub,
    },
  ];

  return (
    <div className="step-panel active">
      <div className="step-heading">
        <h2>{t.s1bTitle}</h2>
        <p className="sub">{t.s1bSub}</p>
      </div>

      <div className="strand-grid">
        {options.map((opt) => (
          <div
            key={opt.id}
            className={`strand-card${bacStatus === opt.id ? " selected" : ""}`}
            onClick={() => setBacStatus(opt.id)}
          >
            <div className="strand-emoji">{opt.emoji}</div>
            <div className="strand-name">{opt.label}</div>
            <div className="strand-kh" style={{ marginTop: "0.35rem", fontSize: "0.78rem" }}>
              {opt.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="step-nav">
        <button className="btn-back" onClick={() => setStep(1)}>← {t.back}</button>
        <button
          className="btn-next"
          onClick={() => setStep(3)}
          disabled={!bacStatus}
        >
          {t.nextBacStatus} →
        </button>
      </div>
    </div>
  );
}
