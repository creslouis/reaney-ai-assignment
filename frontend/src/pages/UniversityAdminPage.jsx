import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { apiFetch } from "../api";

export default function UniversityAdminPage() {
  const { lang, adminRequest } = useApp();
  const t = T[lang];
  const [apiKey, setApiKey] = useState("");
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [universityForm, setUniversityForm] = useState({
    name: "",
    location: "",
    type: "public",
    website: "",
    tuition_usd_year: "",
    scholarship_available: false,
    description: "",
  });
  const [programForms, setProgramForms] = useState({});

  const setUniversityField = (key, value) => {
    setUniversityForm((prev) => ({ ...prev, [key]: value }));
  };

  const setProgramField = (universityId, key, value) => {
    setProgramForms((prev) => ({
      ...prev,
      [universityId]: {
        major_name: "",
        major_name_kh: "",
        faculty: "",
        duration_years: "4",
        degree_level: "Bachelor",
        language: "English/Khmer",
        program_url: "",
        ...(prev[universityId] || {}),
        [key]: value,
      },
    }));
  };

  const loadUniversities = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/v1/universities");
      setUniversities(data);
    } catch {
      setError(t.adminUniversityLoadError);
    }
    setLoading(false);
  };

  const runAdminAction = async (path) => {
    if (!apiKey.trim()) {
      setError(t.adminLoadError);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await adminRequest(path, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
      });
      setMessage(JSON.stringify(data));
      await loadUniversities();
    } catch {
      setError(t.adminUniversityActionError);
      setLoading(false);
    }
  };

  const createUniversity = async () => {
    if (!apiKey.trim()) {
      setError(t.adminLoadError);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await adminRequest("/api/v1/universities", {
        method: "POST",
        headers: { "X-API-Key": apiKey },
        body: JSON.stringify({
          ...universityForm,
          tuition_usd_year: universityForm.tuition_usd_year ? Number(universityForm.tuition_usd_year) : null,
        }),
      });
      setUniversityForm({
        name: "",
        location: "",
        type: "public",
        website: "",
        tuition_usd_year: "",
        scholarship_available: false,
        description: "",
      });
      setMessage(t.adminUniversityCreateSuccess);
      await loadUniversities();
    } catch {
      setError(t.adminUniversityCreateError);
      setLoading(false);
    }
  };

  const createProgram = async (universityId) => {
    if (!apiKey.trim()) {
      setError(t.adminLoadError);
      return;
    }
    const form = programForms[universityId];
    if (!form?.major_name) {
      setError(t.adminUniversityProgramError);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/v1/universities/${universityId}/programs`, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
        body: JSON.stringify(form),
      });
      setProgramForms((prev) => ({ ...prev, [universityId]: {
        major_name: "",
        major_name_kh: "",
        faculty: "",
        duration_years: "4",
        degree_level: "Bachelor",
        language: "English/Khmer",
        program_url: "",
      }}));
      setMessage(t.adminUniversityProgramSuccess);
      await loadUniversities();
    } catch {
      setError(t.adminUniversityProgramError);
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{t.adminUniversityTitle}</h2>
          <p className="sub">{t.adminUniversitySub}</p>
        </div>

        <div className="experience-card">
          <div className="admin-toolbar">
            <input className="form-input" placeholder={t.adminApiKey} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <button className="btn-submit" onClick={loadUniversities} disabled={loading}>{loading ? t.loadingTitle : t.adminLoad}</button>
          </div>

          <div className="admin-action-row">
            <button className="btn-primary-sm" onClick={() => runAdminAction("/api/v1/universities/import")}>{t.adminUniversityImport}</button>
            <button className="btn-primary-sm" onClick={() => runAdminAction("/api/v1/universities/refresh")}>{t.adminUniversityRefresh}</button>
          </div>

          <div className="summary-card" style={{ marginTop: "1rem" }}>
            <div className="section-title">{t.adminUniversityCreateTitle}</div>
            <div className="exp-form-grid">
              <input className="form-input" placeholder={t.adminUniversityName} value={universityForm.name} onChange={(e) => setUniversityField("name", e.target.value)} />
              <input className="form-input" placeholder={t.adminUniversityLocation} value={universityForm.location} onChange={(e) => setUniversityField("location", e.target.value)} />
              <select className="form-select" value={universityForm.type} onChange={(e) => setUniversityField("type", e.target.value)}>
                <option value="public">public</option>
                <option value="private">private</option>
              </select>
              <input className="form-input" placeholder={t.adminUniversityWebsite} value={universityForm.website} onChange={(e) => setUniversityField("website", e.target.value)} />
              <input className="form-input" placeholder={t.adminUniversityTuition} value={universityForm.tuition_usd_year} onChange={(e) => setUniversityField("tuition_usd_year", e.target.value)} />
              <label className="form-label admin-checkbox"><input type="checkbox" checked={universityForm.scholarship_available} onChange={(e) => setUniversityField("scholarship_available", e.target.checked)} /> {t.adminUniversityScholarship}</label>
            </div>
            <textarea className="form-input exp-textarea" placeholder={t.adminUniversityDescription} value={universityForm.description} onChange={(e) => setUniversityField("description", e.target.value)} />
            <div className="step-nav"><div /><button className="btn-submit" onClick={createUniversity}>{t.adminUniversityCreate}</button></div>
          </div>

          {message && <div className="experience-status success">{message}</div>}
          {error && <div className="experience-status error">{error}</div>}

          <div className="admin-list">
            {universities.map((item) => (
              <div className="result-card open" key={item.id}>
                <div className="result-card-header" style={{ cursor: "default" }}>
                  <div className={`rank-badge ${item.type === "public" ? "rank-2" : "rank-3"}`}>{item.type === "public" ? "PU" : "PR"}</div>
                  <div className="result-info">
                    <div className="result-major">{item.name}</div>
                    <div className="result-major-kh">{item.location} · {item.website || "-"}</div>
                    <div className="uni-meta" style={{ marginTop: "0.4rem" }}>
                      <span>{t.public}: {item.type}</span>
                      <span>{t.mlSamples}: {item.programs?.length || 0} {t.adminUniversityPrograms}</span>
                      <span>{item.tuition_usd_year ? `$${item.tuition_usd_year}/year` : "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="result-body" style={{ display: "block" }}>
                  <div className="section-title">{t.adminUniversityProgramsTitle}</div>
                  <div className="uni-list">
                    {(item.programs || []).map((program) => (
                      <div className="uni-card" key={program.id}>
                        <div className="uni-info">
                          <div className="uni-name">{program.major_name}</div>
                          <div className="uni-meta">
                            <span>{program.major_name_kh || "-"}</span>
                            <span>{program.faculty || "-"}</span>
                            <span>{program.degree_level}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="section-title" style={{ marginTop: "1rem" }}>{t.adminUniversityAddProgram}</div>
                  <div className="exp-form-grid">
                    <input className="form-input" placeholder={t.adminProgramMajor} value={programForms[item.id]?.major_name || ""} onChange={(e) => setProgramField(item.id, "major_name", e.target.value)} />
                    <input className="form-input" placeholder={t.adminProgramMajorKh} value={programForms[item.id]?.major_name_kh || ""} onChange={(e) => setProgramField(item.id, "major_name_kh", e.target.value)} />
                    <input className="form-input" placeholder={t.adminProgramFaculty} value={programForms[item.id]?.faculty || ""} onChange={(e) => setProgramField(item.id, "faculty", e.target.value)} />
                    <input className="form-input" placeholder={t.adminProgramDuration} value={programForms[item.id]?.duration_years || ""} onChange={(e) => setProgramField(item.id, "duration_years", e.target.value)} />
                    <input className="form-input" placeholder={t.adminProgramDegree} value={programForms[item.id]?.degree_level || ""} onChange={(e) => setProgramField(item.id, "degree_level", e.target.value)} />
                    <input className="form-input" placeholder={t.adminProgramLanguage} value={programForms[item.id]?.language || ""} onChange={(e) => setProgramField(item.id, "language", e.target.value)} />
                  </div>
                  <input className="form-input" placeholder={t.adminProgramUrl} value={programForms[item.id]?.program_url || ""} onChange={(e) => setProgramField(item.id, "program_url", e.target.value)} style={{ marginTop: "0.85rem" }} />
                  <div className="step-nav"><div /><button className="btn-submit" onClick={() => createProgram(item.id)}>{t.adminUniversityProgramCreate}</button></div>
                </div>
              </div>
            ))}
            {!universities.length && !loading && <div className="why-text">{t.adminUniversityEmpty}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
