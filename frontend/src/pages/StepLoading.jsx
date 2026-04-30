import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function StepLoading() {
  const { lang } = useApp();
  const t = T[lang];
  return (
    <div className="step-panel active">
      <div className="loading-panel">
        <div className="loading-spinner" />
        <div className="loading-text">{t.loadingTitle}</div>
        <div className="loading-sub">{t.loadingSub}</div>
        <div className="loading-dots" style={{ marginTop: "1.5rem" }}>
          <span>●</span><span>●</span><span>●</span>
        </div>
      </div>
    </div>
  );
}
