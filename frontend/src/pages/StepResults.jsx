import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import ResultCard from "../components/ResultCard";
import Chat from "../components/Chat";

export default function StepResults() {
  const { lang, strand, interests, location, results, restart, setShowModal } = useApp();
  const t = T[lang];

  const strandLabel = lang === "km"
    ? { science: "វិទ្យាសាស្ត្រ", social: "សង្គមវិទ្យា" }[strand]
    : { science: "Science", social: "Social Science" }[strand];

  return (
    <div className="step-panel active">
      {/* Save banner */}
      <div className="save-banner">
        <div>
          <p>{t.saveBannerTitle}</p>
          <p className="sub">{t.saveBannerSub}</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowModal("save")}>{t.saveBtn}</button>
      </div>

      {/* Results header */}
      <div className="results-header">
        <h2>{t.resultsTitle}</h2>
        <p className="sub">{t.resultsSubFn(strandLabel)}</p>
        <div className="results-meta">
          {interests.map((i) => (
            <span key={i} className="meta-chip">🎯 {i}</span>
          ))}
          {location && (
            <span className="meta-chip">📍 {location.replace("_", " ")}</span>
          )}
        </div>
      </div>

      {/* Result cards */}
      {results.map((r, i) => (
        <ResultCard key={i} result={r} index={i} animDelay={0.1 + i * 0.1} />
      ))}

      <button className="btn-restart" onClick={restart}>{t.restartBtn}</button>

      {/* AI Chat */}
      {results.length > 0 && <Chat />}
    </div>
  );
}
