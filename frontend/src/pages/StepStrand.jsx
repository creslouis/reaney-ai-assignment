import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { cmsText } from "../cms";

export default function StepStrand() {
  const { lang, strand, setStrand, setStep, cmsBundle } = useApp();
  const t = T[lang];

  const strands = [
    { id: "science", emoji: "🔬", label: t.strandScience, sub: "វិទ្យាសាស្ត្រ" },
    { id: "social",  emoji: "🌏", label: t.strandSocial,  sub: "វិទ្យាសាស្ត្រសង្គម" },
  ];

  return (
    <div className="step-panel active">
      <div className="step-heading">
        <h2>{cmsText(cmsBundle, "content.home", "strand_title_en", "strand_title_km", lang, t.s1Title)}</h2>
        <p className="sub">{cmsText(cmsBundle, "content.home", "strand_sub_en", "strand_sub_km", lang, t.s1Sub)}</p>
      </div>

      <div className="strand-grid">
        {strands.map((s) => (
          <div
            key={s.id}
            className={`strand-card${strand === s.id ? " selected" : ""}`}
            onClick={() => setStrand(s.id)}
          >
            <div className="strand-emoji">{s.emoji}</div>
            <div className="strand-name">{s.label}</div>
            {lang === "en" && <div className="strand-kh">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="step-nav">
        <div />
        <button
          className="btn-next"
          onClick={() => setStep(2)}
          disabled={!strand}
        >
          {t.nextGrades} →
        </button>
      </div>
    </div>
  );
}
