import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

const RANK_CLASSES = ["rank-1", "rank-2", "rank-3", "rank-other"];
const RANK_LABELS = ["#1", "#2", "#3", "#4"];

export default function ResultCard({ result, index, animDelay }) {
  const { lang } = useApp();
  const t = T[lang];
  const [open, setOpen] = useState(index === 0);

  return (
    <div
      className={`result-card${open ? " open" : ""}`}
      style={{ animationDelay: `${animDelay}s` }}
    >
      {/* Header */}
      <div className="result-card-header" onClick={() => setOpen((o) => !o)}>
        <div className={`rank-badge ${RANK_CLASSES[index] || "rank-other"}`}>
          {RANK_LABELS[index] || `#${index + 1}`}
        </div>

        <div className="result-info">
          <div className="result-major">
            {lang === "km" ? result.major_kh : result.major}
          </div>
          <div className="result-major-kh">
            {lang === "km" ? result.major : result.major_kh}
          </div>
          <div className="match-score">
            <div className="match-bar-bg">
              <div className="match-bar-fill" style={{ width: `${result.match}%` }} />
            </div>
            <span className="match-pct">{result.match}% {t.matchLabel}</span>
          </div>
        </div>

        <div className="expand-icon">▾</div>
      </div>

      {/* Body */}
      {open && (
        <div className="result-body">
          {/* Why section */}
          <div className="why-section">
            <div className="section-title">{t.whyTitle}</div>
            <div className="why-text">
              {lang === "km" ? result.why_kh : result.why_en}
            </div>
            <div className="why-text-kh">
              {lang === "km" ? result.why_en : result.why_kh}
            </div>
          </div>

          {/* Universities */}
          <div>
            <div className="section-title">{t.unisTitle}</div>
            <div className="uni-list">
              {(result.universities || []).map((u, i) => (
                <div className="uni-card" key={i}>
                  <div className={`uni-icon ${u.type === "public" ? "public-uni" : "private-uni"}`}>
                    {u.type === "public" ? "🏛️" : "🎓"}
                  </div>
                  <div className="uni-info">
                    <div className="uni-name">{u.name}</div>
                    <div className="uni-meta">
                      <span className={`uni-type-badge ${u.type === "public" ? "badge-public" : "badge-private"}`}>
                        {u.type === "public" ? t.public : t.private}
                      </span>
                      <span className="uni-tuition">{u.tuition}</span>
                      <span className="uni-rank">⭐ {u.rank}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!!result.experience_insights?.length && (
            <div className="experience-insights-section">
              <div className="section-title">{t.realWorldAdviceTitle}</div>
              <div className="experience-insight-list">
                {result.experience_insights.map((entry, i) => (
                  <div className="experience-insight-card" key={i}>
                    <div className="experience-insight-meta">
                      <span className="meta-chip">{entry.contributor_type || t.realWorldContributor}</span>
                      {entry.university && <span className="meta-chip">{entry.university}</span>}
                      {entry.job_title && <span className="meta-chip">{entry.job_title}</span>}
                    </div>
                    {entry.why_choose_text && <div className="why-text">{entry.why_choose_text}</div>}
                    {entry.challenges_text && <div className="why-text-kh">{entry.challenges_text}</div>}
                    {entry.advice_text && <div className="experience-advice">{t.realWorldAdviceLabel}: {entry.advice_text}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
