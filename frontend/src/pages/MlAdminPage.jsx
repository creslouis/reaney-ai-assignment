import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function MlAdminPage() {
  const { lang, adminRequest } = useApp();
  const t = T[lang];
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const headers = { "X-API-Key": apiKey };
      const [statusData, evaluationData] = await Promise.all([
        adminRequest("/api/v1/ml/status", { headers }),
        adminRequest("/api/v1/ml/evaluation", { headers }),
      ]);
      setStatus(statusData);
      setEvaluation(evaluationData);
    } catch {
      setError(t.adminLoadError);
    }
    setLoading(false);
  };

  const retrain = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const data = await adminRequest("/api/v1/ml/retrain", {
        method: "POST",
        headers: { "X-API-Key": apiKey },
      });
      setActionMessage(`${t.adminRetrainSuccess}: ${JSON.stringify(data)}`);
      await loadData();
    } catch {
      setError(t.adminRetrainError);
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.adminMlTitle}</h2>
          <p className="sub">{t.adminMlSub}</p>
        </div>

        <div className="experience-card">
          <div className="admin-toolbar">
            <input className="form-input" placeholder={t.adminApiKey} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <div className="admin-button-group">
              <button className="btn-submit" onClick={loadData} disabled={loading || !apiKey.trim()}>{loading ? t.loadingTitle : t.adminLoad}</button>
              <button className="btn-primary-sm" onClick={retrain} disabled={loading || !apiKey.trim()}>{t.adminRetrain}</button>
            </div>
          </div>

          {actionMessage && <div className="experience-status success">{actionMessage}</div>}
          {error && <div className="experience-status error">{error}</div>}

          {status && (
            <div className="admin-stats">
              <div className="meta-chip">{t.mlModelType}: {status.model_type}</div>
              <div className="meta-chip">{t.mlAccuracy}: {Math.round((status.accuracy || 0) * 100)}%</div>
              <div className="meta-chip">{t.mlSamples}: {status.training_samples}</div>
              <div className="meta-chip">{t.mlReady}: {status.is_ready ? t.mlYes : t.mlNo}</div>
            </div>
          )}

          {evaluation && (
            <div className="admin-list">
              <div className="result-card open">
                <div className="result-card-header" style={{ cursor: "default" }}>
                  <div className="rank-badge rank-1">ML</div>
                  <div className="result-info">
                    <div className="result-major">{evaluation.model_type}</div>
                    <div className="result-major-kh">{evaluation.training_date || "-"}</div>
                    <div className="uni-meta" style={{ marginTop: "0.4rem" }}>
                      <span>{t.mlTop3}: {Math.round((evaluation.top3_accuracy || 0) * 100)}%</span>
                      <span>{t.mlPrecision}: {Math.round((evaluation.precision || 0) * 100)}%</span>
                      <span>{t.mlRecall}: {Math.round((evaluation.recall || 0) * 100)}%</span>
                      <span>{t.mlF1}: {Math.round((evaluation.f1 || 0) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {!!evaluation.comparison?.length && (
                <div className="comparison-grid">
                  {evaluation.comparison.map((item) => (
                    <div className="comparison-card" key={item.model}>
                      <div className="section-title">{item.model}</div>
                      <div className="why-text">{t.mlAccuracy}: {Math.round((item.accuracy || 0) * 100)}%</div>
                      <div className="why-text-kh">{t.mlTop3}: {Math.round((item.top3_accuracy || 0) * 100)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
