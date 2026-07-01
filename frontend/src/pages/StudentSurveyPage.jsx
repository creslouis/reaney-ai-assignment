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

const StudentSurveyPage = () => {
  const { lang } = useApp();
  const t = T[lang];
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    study_track: "",
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

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/hs-survey/submit", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setPrediction(res.prediction);
        setStep(5);
      }
    } catch (err) {
      setError(err.message || "Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadResponse = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "my_survey_response.json");
    a.click();
  };

  return (
    <div className="step-panel active">
      
      {step === 1 && (
        <>
          <div className="step-heading">
            <h2>{lang === "en" ? "Basic Information" : "ព័ត៌មានមូលដ្ឋាន"}</h2>
            <p className="sub">{lang === "en" ? "Tell us about your high school study track and intended major." : "ប្រាប់យើងអំពីផ្នែកសិក្សារបស់អ្នកនិងជំនាញដែលចង់រៀន។"}</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">{lang === "en" ? "Study Track" : "ផ្នែកសិក្សា"}</label>
            <div className="budget-grid">
              <div 
                className={`budget-option ${formData.study_track === "Science Track" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, study_track: "Science Track"})}
              >
                <div className="amount">{lang === "en" ? "Science Track" : "ថ្នាក់វិទ្យាសាស្ត្រ"}</div>
              </div>
              <div 
                className={`budget-option ${formData.study_track === "Social Science Track" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, study_track: "Social Science Track"})}
              >
                <div className="amount">{lang === "en" ? "Social Science" : "ថ្នាក់សង្គម"}</div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">{lang === "en" ? "What major do you want to study?" : "តើអ្នកចង់រៀនជំនាញអ្វី?"}</label>
            <input 
              type="text" 
              className="form-select" 
              style={{ background: "#fff" }}
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
            {formData.intended_major && <p style={{ fontSize: "14px", color: "var(--primary)", marginTop: "8px" }}>Selected: <strong>{formData.intended_major}</strong></p>}
          </div>

          <div className="step-nav">
            <button className="btn-submit" onClick={handleNext} disabled={!formData.study_track || !formData.intended_major} style={{ width: "100%" }}>
              {t.next} →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="step-heading">
            <h2>{lang === "en" ? "Grades (BAC II)" : "និទ្ទេស (BAC II)"}</h2>
            <p className="sub">{lang === "en" ? "Enter your actual or expected grades." : "បញ្ចូលនិទ្ទេសពិតប្រាកដ ឬរំពឹងទុករបស់អ្នក។"}</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            {['math', 'khmer', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography'].map(subj => (
              <div className="form-group" key={subj} style={{ marginBottom: "10px" }}>
                <label className="form-label" style={{ textTransform: "capitalize" }}>{subj}</label>
                <div className="select-wrap">
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
              </div>
            ))}
          </div>

          <div className="step-nav">
            <button className="btn-back" onClick={handlePrev}>← {t.back}</button>
            <button className="btn-submit" onClick={handleNext}>{t.next} →</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="step-heading">
            <h2>{t.s3Title}</h2>
            <p className="sub">{t.s3Sub}</p>
          </div>
          
          <div className="interests-grid">
            {t.interests.map((i) => {
              const isSelected = formData.interests.includes(i.val);
              return (
                <button
                  key={i.val}
                  className={`interest-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    if (isSelected) {
                      setFormData({...formData, interests: formData.interests.filter(x => x !== i.val)});
                    } else if (formData.interests.length < 5) {
                      setFormData({...formData, interests: [...formData.interests, i.val]});
                    }
                  }}
                >
                  <span className="icon">{i.icon}</span>
                  {i.label}
                </button>
              );
            })}
          </div>

          <div className="step-nav">
            <button className="btn-back" onClick={handlePrev}>← {t.back}</button>
            <button className="btn-submit" onClick={handleNext}>{t.next} →</button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="step-heading">
            <h2>{lang === "en" ? "Preferences" : "ចំណូលចិត្ត"}</h2>
            <p className="sub">{lang === "en" ? "Help us tailor the recommendations to your situation." : "ជួយយើងក្នុងការណែនាំតាមស្ថានភាពរបស់អ្នក។"}</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">{t.locationLabel}</label>
            <div className="select-wrap">
              <select 
                className="form-select" 
                value={formData.province} 
                onChange={(e) => setFormData({...formData, province: e.target.value})}
              >
                <option value="">{t.locationAny}</option>
                {t.locations.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.budgetLabel}</label>
            <div className="budget-grid">
              {t.budgets.map(b => (
                <div
                  key={b.val}
                  className={`budget-option ${formData.budget_range === b.val ? "selected" : ""}`}
                  onClick={() => setFormData({...formData, budget_range: b.val})}
                >
                  <div className="amount">{b.amount}</div>
                  <div className="label">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="experience-status error" style={{ marginTop: "1rem" }}>{error}</div>}

          <div className="step-nav">
            <button className="btn-back" onClick={handlePrev} disabled={isSubmitting}>← {t.back}</button>
            <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "..." : (lang === "en" ? "Submit Survey" : "បញ្ជូនការស្ទង់មតិ")}
            </button>
          </div>
        </>
      )}

      {step === 5 && prediction && (
        <>
          <div className="step-heading" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h2>{lang === "en" ? "Thank You!" : "សូមអរគុណ!"}</h2>
            <p className="sub">{lang === "en" ? "Your survey has been recorded." : "ការស្ទង់មតិរបស់អ្នកត្រូវបានរក្សាទុក។"}</p>
          </div>
          
          <div className="experience-card" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h3 style={{ color: "var(--primary)", fontSize: "1.1rem", marginBottom: "1rem" }}>
              {lang === "en" ? "AI Prediction based on your data:" : "ការព្យាករណ៍ AI ផ្អែកលើទិន្នន័យរបស់អ្នក៖"}
            </h3>
            <div style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0" }}>{prediction.top_major}</div>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "1rem" }}>
              {lang === "en" ? prediction.all_predictions[0].explanation_en : prediction.all_predictions[0].explanation_kh}
            </p>
          </div>

          <div className="step-nav" style={{ justifyContent: "center", flexDirection: "column", gap: "15px" }}>
            <button className="btn-submit" onClick={handleDownloadResponse} style={{ background: "var(--primary-dark)" }}>
              ⬇️ {lang === "en" ? "Download My Response (JSON)" : "ទាញយកចម្លើយរបស់ខ្ញុំ"}
            </button>
            <Link to="/" className="btn-back" style={{ textAlign: "center", textDecoration: "none" }}>
              {lang === "en" ? "Return to Home" : "ត្រឡប់ទៅទំព័រដើម"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentSurveyPage;
