import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { apiFetch, authHeaders, getStoredAdminToken } from "../api";

export default function MlAdminPage() {
  const { lang } = useApp();
  const t = T[lang];
  const [status, setStatus] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [retrainAfter, setRetrainAfter] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const token = getStoredAdminToken();

  const loadData = async () => {
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const headers = authHeaders(token);
      const [statusData, evaluationData] = await Promise.all([
        apiFetch("/api/v1/ml/status", { headers }),
        apiFetch("/api/v1/ml/evaluation", { headers }),
      ]);
      setStatus(statusData);
      setEvaluation(evaluationData);
    } catch (e) {
      setError(e.message || t.adminLoadError);
    }
    setLoading(false);
  };

  const retrain = async () => {
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const data = await apiFetch("/api/v1/ml/retrain", {
        method: "POST",
        headers: authHeaders(token),
      });
      setActionMessage(`Retrained! Accuracy: ${Math.round((data.new_accuracy || 0) * 100)}% | Samples: ${data.training_samples}`);
      await loadData();
    } catch (e) {
      setError(e.message || t.adminRetrainError);
      setLoading(false);
    }
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
        headers: authHeaders(token),
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
