import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { apiFetch } from "../api";
import { T } from "../data/translations";

const MAJORS = [
  "Computer Science & IT",
  "Business Administration",
  "Accounting & Finance",
  "Civil Engineering",
  "Electrical Engineering",
  "Medicine & Health Sciences",
  "Nursing",
  "Education & Teaching",
  "Law",
  "Tourism & Hospitality",
  "Agriculture",
  "Architecture",
  "Environmental Science",
  "Media & Communication",
  "International Relations",
  "Political Science",
  "Public Administration",
  "Economics"
];

export default function StudentSurveyPage() {
  const { lang } = useApp();
  const t = T[lang];
  const [step, setStep] = useState(1); // 1 = Form, 2 = Results
  const [formData, setFormData] = useState({
    study_track: "Science Track",
    intended_major: "",
    province: "",
    budget_range: "",
    math_score: 0,
    khmer_score: 0,
    english_score: 0,
    science_score: 0,
    biology_score: 0,
    history_score: 0,
    geography_score: 0,
    physics_score: 0,
    chemistry_score: 0,
    interests: [],
    personality: {
      analytical_score: 3.0,
      creative_score: 3.0,
      people_oriented_score: 3.0,
      detail_oriented_score: 3.0,
    }
  });

  const [searchMajor, setSearchMajor] = useState("");
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filteredMajors = MAJORS.filter(m => m.toLowerCase().includes(searchMajor.toLowerCase()));

  const handleSubmit = async () => {
    if (!formData.intended_major) {
      setError(lang === "en" ? "Please select your intended major." : "សូមជ្រើសរើសជំនាញដែលចង់រៀន។");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/hs-survey/submit", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setPrediction(res.prediction);
        setStep(2); // Show results
      }
    } catch (err) {
      setError(err.message || "Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (val) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(val);
      if (isSelected) {
        return { ...prev, interests: prev.interests.filter(x => x !== val) };
      } else if (prev.interests.length < 5) {
        return { ...prev, interests: [...prev.interests, val] };
      }
      return prev;
    });
  };

  const handleDownloadResponse = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "my_survey_response.json");
    a.click();
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{lang === "en" ? "High School Student Survey" : "ការស្ទង់មតិសិស្សវិទ្យាល័យ"}</h2>
          <p className="sub">{lang === "en" ? "Help us tailor recommendations to your situation." : "ជួយយើងក្នុងការណែនាំតាមស្ថានភាពរបស់អ្នក។"}</p>
        </div>

        {step === 1 && (
          <div className="experience-card">
            
            <div className="section-title">{lang === "en" ? "Study Track" : "ផ្នែកសិក្សា"}</div>
            <div className="strand-grid exp-grid-3">
              <div 
                className={`strand-card ${formData.study_track === "Science Track" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, study_track: "Science Track"})}
              >
                <div className="strand-emoji">🔬</div>
                <div className="strand-name">{lang === "en" ? "Science Track" : "ថ្នាក់វិទ្យាសាស្ត្រ"}</div>
              </div>
              <div 
                className={`strand-card ${formData.study_track === "Social Science Track" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, study_track: "Social Science Track"})}
              >
                <div className="strand-emoji">📖</div>
                <div className="strand-name">{lang === "en" ? "Social Science" : "ថ្នាក់សង្គម"}</div>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "What major do you want to study?" : "តើអ្នកចង់រៀនជំនាញអ្វី?"}</div>
            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={lang === "en" ? "Type to search majors..." : "វាយដើម្បីស្វែងរកជំនាញ..."}
                value={searchMajor}
                onChange={(e) => {
                  setSearchMajor(e.target.value);
                  setShowMajorSuggestions(true);
                }}
                onFocus={() => setShowMajorSuggestions(true)}
              />
              {showMajorSuggestions && searchMajor && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  {filteredMajors.map(m => (
                    <div 
                      key={m} 
                      style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                      onClick={() => {
                        setFormData({...formData, intended_major: m});
                        setSearchMajor(m);
                        setShowMajorSuggestions(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                  {filteredMajors.length === 0 && (
                    <div style={{ padding: "12px 16px" }}>
                      <button className="btn-submit" style={{ padding: "8px", fontSize: "14px" }} onClick={() => {
                        setFormData({...formData, intended_major: searchMajor});
                        setShowMajorSuggestions(false);
                      }}>
                        Use "{searchMajor}"
                      </button>
                    </div>
                  )}
                </div>
              )}
              {formData.intended_major && <p style={{ fontSize: "14px", color: "var(--primary)", marginTop: "8px", fontWeight: "500" }}>Selected: {formData.intended_major}</p>}
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "Grades (BAC II)" : "និទ្ទេស (BAC II)"}</div>
            <div className="exp-form-grid">
              {['math', 'khmer', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography'].map(subj => (
                <div key={subj}>
                  <label className="form-label" style={{ textTransform: "capitalize", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>{subj}</label>
                  <select 
                    className="form-select" 
                    value={formData[`${subj}_score`]} 
                    onChange={(e) => setFormData({...formData, [`${subj}_score`]: parseFloat(e.target.value)})}
                  >
                    <option value={0}>-</option>
                    <option value={5}>A</option>
                    <option value={4}>B</option>
                    <option value={3}>C</option>
                    <option value={2}>D</option>
                    <option value={1}>E</option>
                    <option value={0}>F</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{t.s3Title}</div>
            <div className="tag-cloud">
              {t.interests.map((item) => (
                <span
                  key={item.val}
                  className={`interest-tag${formData.interests.includes(item.val) ? " selected" : ""}`}
                  onClick={() => toggleInterest(item.val)}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "Preferences" : "ចំណូលចិត្ត"}</div>
            <div className="exp-form-grid">
              <div>
                <label className="form-label" style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>{t.locationLabel}</label>
                <select 
                  className="form-select" 
                  value={formData.province} 
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                >
                  <option value="">{t.locationAny}</option>
                  {t.locations.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>{t.budgetLabel}</label>
                <select 
                  className="form-select" 
                  value={formData.budget_range} 
                  onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                >
                  <option value="">{lang === "en" ? "Any" : "ណាមួយក៏បាន"}</option>
                  {t.budgets.map(b => <option key={b.val} value={b.val}>{b.amount} ({b.desc})</option>)}
                </select>
              </div>
            </div>

            {error && <div className="experience-status error" style={{ marginTop: "1.5rem" }}>{error}</div>}

            <div className="step-nav" style={{ marginTop: "2rem" }}>
              <div />
              <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (lang === "en" ? "Submitting..." : "កំពុងបញ្ជូន...") : (lang === "en" ? "Submit Survey" : "បញ្ជូនការស្ទង់មតិ")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && prediction && (
          <div className="experience-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>{lang === "en" ? "Thank You!" : "សូមអរគុណ!"}</h2>
            <p className="sub" style={{ marginBottom: "2rem" }}>{lang === "en" ? "Your survey has been recorded." : "ការស្ទង់មតិរបស់អ្នកត្រូវបានរក្សាទុក។"}</p>
            
            <div style={{ background: "var(--background-secondary)", padding: "2rem", borderRadius: "12px", marginBottom: "2rem" }}>
              <h3 style={{ color: "var(--primary)", fontSize: "1.1rem", marginBottom: "1rem" }}>
                {lang === "en" ? "AI Prediction based on your data:" : "ការព្យាករណ៍ AI ផ្អែកលើទិន្នន័យរបស់អ្នក៖"}
              </h3>
              <div style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0" }}>{prediction.top_major}</div>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "1rem" }}>
                {lang === "en" ? prediction.all_predictions[0].explanation_en : prediction.all_predictions[0].explanation_kh}
              </p>
            </div>

            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-submit" onClick={handleDownloadResponse} style={{ background: "var(--primary-dark)" }}>
                ⬇️ {lang === "en" ? "Download My Response (JSON)" : "ទាញយកចម្លើយរបស់ខ្ញុំ"}
              </button>
              <Link to="/" className="btn-back" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                {lang === "en" ? "Return to Home" : "ត្រឡប់ទៅទំព័រដើម"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
