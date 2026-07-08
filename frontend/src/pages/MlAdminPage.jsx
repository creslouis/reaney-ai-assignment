import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { authHeaders } from "../api";

export default function MlAdminPage() {
  const { lang, adminRequest, adminToken } = useApp();
  const t = T[lang];
  const [status, setStatus] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [surveyStats, setSurveyStats] = useState(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [retrainAfter, setRetrainAfter] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const [statusData, evaluationData, surveyData] = await Promise.all([
        adminRequest("/api/v1/ml/status"),
        adminRequest("/api/v1/ml/evaluation"),
        adminRequest("/api/v1/hs-survey/stats").catch(() => null),
      ]);
      setStatus(statusData);
      setEvaluation(evaluationData);
      setSurveyStats(surveyData);
    } catch (e) {
      setError(e.message || t.adminLoadError);
    }
    setLoading(false);
  };

  const exportSurveys = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${base}/api/v1/hs-survey/export`, {
        headers: authHeaders(adminToken)
      });
      if (!response.ok) {
        throw new Error("Failed to export surveys");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hs_survey_export.jsonl";
      a.click();
      window.URL.revokeObjectURL(url);
      await loadData();
    } catch (e) {
      setError(e.message || "Failed to export surveys");
    }
  };

  const retrain = async () => {
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const data = await adminRequest("/api/v1/ml/retrain", {
        method: "POST",
      });
      setActionMessage(`Retrained! Accuracy: ${Math.round((data.new_accuracy || 0) * 100)}% | Samples: ${data.training_samples}`);
      await loadData();
    } catch (e) {
      setError(e.message || t.adminRetrainError);
      setLoading(false);
    }
  };

  const runVerification = async (mode) => {
    setVerifyLoading(mode);
    setError("");
    try {
      const data = await adminRequest(`/api/v1/ml/verify?mode=${mode}`);
      setVerification(data);
    } catch (e) {
      setError(e.message || "Verification failed");
    }
    setVerifyLoading("");
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f) => {
    const allowed = [".csv", ".json", ".jsonl"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError("Only CSV or JSON files are supported.");
      return;
    }
    setUploadFile(f);
    setUploadError("");
    setUploadResult(null);
  };

  const uploadDataset = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError("");
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = `${base}/api/v1/ml/upload-dataset?retrain_after=${retrainAfter}`;
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(adminToken),
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail?.message || data?.detail || "Upload failed");
      }
      setUploadResult(data);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (retrainAfter) await loadData();
    } catch (e) {
      setUploadError(e.message || "Upload failed");
    }
    setUploadLoading(false);
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.adminMlTitle}</h2>
          <p className="sub">{t.adminMlSub}</p>
        </div>

        <div className="experience-card" style={{ marginBottom: "1.5rem" }}>
          <div className="step-heading" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>System Verification</h3>
            <p className="sub">Run consistency checks for database, ML runtime, major mappings, and Gemini.</p>
          </div>

          <div className="admin-toolbar">
            <div className="admin-button-group">
              <button className="btn-submit" onClick={() => runVerification("shallow")} disabled={!!verifyLoading}>
                {verifyLoading === "shallow" ? "Checking..." : "Run Quick Check"}
              </button>
              <button className="btn-primary-sm" onClick={() => runVerification("deep")} disabled={!!verifyLoading}>
                {verifyLoading === "deep" ? "Checking..." : "Run Deep Check"}
              </button>
            </div>
          </div>

          {verification && (
            <div className="admin-list">
              <div className="admin-stats">
                <div className="meta-chip">Status: {verification.status}</div>
                <div className="meta-chip">Mode: {verification.mode}</div>
                <div className="meta-chip">Predictor: {verification.summary?.predictor_mode || "-"}</div>
              </div>

              {!!verification.summary?.failed_checks?.length && (
                <div className="experience-status error" style={{ marginTop: "1rem" }}>
                  Failed checks: {verification.summary.failed_checks.join(", ")}
                </div>
              )}

              {Object.entries(verification.checks || {}).map(([name, check]) => (
                <div className="result-card open" key={name} style={{ marginTop: "1rem" }}>
                  <div className="result-card-header" style={{ cursor: "default" }}>
                    <div className={`rank-badge ${check.ok ? "rank-1" : "rank-other"}`}>{check.ok ? "OK" : "!"}</div>
                    <div className="result-info">
                      <div className="result-major">{name.replace(/_/g, " ")}</div>
                      <div className="why-text" style={{ marginTop: "0.4rem", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(check, null, 2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status / Retrain card */}
        <div className="experience-card" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-toolbar">
            <div className="admin-button-group">
              <button className="btn-submit" onClick={loadData} disabled={loading}>
                {loading ? t.loadingTitle : t.adminLoad}
              </button>
              <button className="btn-primary-sm" onClick={retrain} disabled={loading}>
                {t.adminRetrain}
              </button>
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

        {/* High School Survey Stats Card */}
        {surveyStats && (
          <div className="experience-card" style={{ marginBottom: "2rem" }}>
            <div className="step-heading" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>High School Survey Data</h3>
              <p className="sub">Monitor incoming survey responses from high school students.</p>
            </div>
            
            <div style={{ padding: "1.5rem", background: "var(--background-secondary)", borderRadius: "8px", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)" }}>
                    {surveyStats.total_surveys} <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: "normal" }}>/ {surveyStats.threshold}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Surveys Collected</div>
                </div>
                
                {surveyStats.ready_for_export && (
                  <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "0.5rem 1rem", borderRadius: "20px", fontWeight: "bold", fontSize: "0.85rem" }}>
                    ✓ Ready for Export
                  </div>
                )}
              </div>
              
              <div style={{ width: "100%", height: "8px", background: "#ddd", borderRadius: "4px", marginTop: "1rem", overflow: "hidden" }}>
                <div style={{ 
                  width: `${Math.min(100, (surveyStats.total_surveys / surveyStats.threshold) * 100)}%`, 
                  height: "100%", 
                  background: surveyStats.ready_for_export ? "#4caf50" : "var(--primary)",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>

            <button
              className="btn-submit"
              onClick={exportSurveys}
              disabled={!surveyStats.total_surveys}
              style={{ width: "100%", background: "var(--primary-dark)" }}
            >
              Export New Surveys to JSONL
            </button>
          </div>
        )}

        {/* Upload Dataset card */}
        <div className="experience-card">
          <div className="step-heading" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Upload Training Dataset</h3>
            <p className="sub">Upload a CSV or JSON file from your Google Survey to train the model with real data.</p>
          </div>

          {/* Drag-and-drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#c0691c" : "#ccc"}`,
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(192,105,28,0.05)" : "transparent",
              transition: "all 0.2s",
              marginBottom: "1rem",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.jsonl"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }}
            />
            {uploadFile ? (
              <div>
                <div style={{ fontSize: "1.5rem" }}>file</div>
                <div style={{ fontWeight: 600, marginTop: "0.5rem" }}>{uploadFile.name}</div>
                <div className="sub">{(uploadFile.size / 1024).toFixed(1)} KB — click to change</div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, marginTop: "0.5rem" }}>Drag and drop CSV or JSON here</div>
                <div className="sub">or click to browse — max 10 MB</div>
              </div>
            )}
          </div>

          {/* Retrain toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id="retrain-toggle"
              checked={retrainAfter}
              onChange={(e) => setRetrainAfter(e.target.checked)}
            />
            <label htmlFor="retrain-toggle" style={{ cursor: "pointer", userSelect: "none" }}>
              Retrain model automatically after upload
            </label>
          </div>

          <button
            className="btn-submit"
            onClick={uploadDataset}
            disabled={!uploadFile || uploadLoading}
            style={{ width: "100%" }}
          >
            {uploadLoading ? "Uploading and Training..." : "Upload and Train"}
          </button>

          {uploadError && (
            <div className="experience-status error" style={{ marginTop: "1rem" }}>
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="experience-status success" style={{ marginTop: "1rem" }}>
              Uploaded {uploadResult.rows_uploaded} rows successfully.
              {uploadResult.retrained && (
                <> Retrained! Accuracy: {Math.round((uploadResult.new_accuracy || 0) * 100)}%
                {" "}({uploadResult.model_type}) — Total samples: {uploadResult.training_samples}</>
              )}
            </div>
          )}

          {/* Column format hint */}
          <details style={{ marginTop: "1.5rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, color: "#c0691c" }}>
              What columns does my CSV need?
            </summary>
            <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.8 }}>
              <p>The uploader auto-maps common column names. Required columns:</p>
              <ul style={{ paddingLeft: "1.2rem" }}>
                <li><strong>target_major</strong> — the student's chosen or ideal major (required)</li>
                <li><strong>math, khmer, english, science, biology, history, geography, physics, chemistry</strong> — grade scores (0-100 or letter A-F)</li>
                <li><strong>interests</strong> — comma-separated: technology, business, medicine, education, arts, law, engineering, agriculture, tourism</li>
                <li><strong>budget</strong> — low / medium / high / scholarship</li>
                <li><strong>province</strong> — phnom_penh or other province name</li>
              </ul>
              <p>Extra Google Form columns (Timestamp, Email Address, etc.) are automatically ignored.</p>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
