import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function ExperienceAdminPage() {
  const { lang, adminRequest } = useApp();
  const t = T[lang];
  const [apiKey, setApiKey] = useState("");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [allItems, statData] = await Promise.all([
        adminRequest("/api/v1/experience/all", { headers: apiKey ? { "X-API-Key": apiKey } : {} }),
        adminRequest("/api/v1/experience/stats", { headers: apiKey ? { "X-API-Key": apiKey } : {} }),
      ]);
      setItems(allItems);
      setStats(statData);
    } catch {
      setError(t.adminLoadError);
    }
    setLoading(false);
  };

  const approve = async (id) => {
    try {
      await adminRequest(`/api/v1/experience/${id}/approve`, {
        method: "PATCH",
        headers: apiKey ? { "X-API-Key": apiKey } : {},
      });
      await loadData();
    } catch {
      setError(t.adminApproveError);
    }
  };
  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.adminExpTitle}</h2>
          <p className="sub">{t.adminExpSub}</p>
        </div>

        <div className="experience-card">
          <div className="admin-toolbar">
            <input
              className="form-input"
              placeholder={t.adminApiKey}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="btn-submit" onClick={loadData} disabled={loading || !apiKey.trim()}>
              {loading ? t.loadingTitle : t.adminLoad}
            </button>
          </div>

          {stats && (
            <div className="admin-stats">
              <div className="meta-chip">{t.adminTotal}: {stats.total_submissions}</div>
              <div className="meta-chip">{t.adminApproved}: {stats.approved_submissions}</div>
            </div>
          )}

          {error && <div className="experience-status error">{error}</div>}

          <div className="admin-list">
            {items.map((item) => (
              <div className="result-card open" key={item.id}>
                <div className="result-card-header" style={{ cursor: "default" }}>
                  <div className="rank-badge rank-other">{item.is_approved ? "✓" : "!"}</div>
                  <div className="result-info">
                    <div className="result-major">{item.name}</div>
                    <div className="result-major-kh">{item.current_major || item.job_title || item.contributor_type}</div>
                    <div className="uni-meta" style={{ marginTop: "0.4rem" }}>
                      <span>{item.university || "-"}</span>
                      <span>{item.contributor_type}</span>
                      <span>{item.satisfaction_score ?? "-"}/5</span>
                    </div>
                  </div>
                  {!item.is_approved && (
                    <button className="btn-primary-sm" onClick={() => approve(item.id)}>{t.adminApprove}</button>
                  )}
                </div>
              </div>
            ))}
            {!items.length && !loading && <div className="why-text">{t.adminNoSubmissions}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
