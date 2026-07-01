import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { apiFetch } from "../api";

// Assuming we have some shared data for majors
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
  const { lang, t } = useApp();
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
        setStep(5); // Result step
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
    <div className="container" style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 className="title" style={{ textAlign: "center", marginBottom: "30px" }}>
        {lang === "en" ? "High School Student Survey" : "ការស្ទង់មតិសិស្សវិទ្យាល័យ"}
      </h1>

      {step === 1 && (
        <div className="card fade-in">
          <h2>{lang === "en" ? "Basic Information" : "ព័ត៌មានមូលដ្ឋាន"}</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <label className="label">{lang === "en" ? "Study Track" : "ផ្នែកសិក្សា"}</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className={`btn ${formData.study_track === "Science Track" ? "primary" : "outline"}`}
                onClick={() => setFormData({...formData, study_track: "Science Track"})}
                style={{ flex: 1 }}
              >
                {lang === "en" ? "Science Track" : "ថ្នាក់វិទ្យាសាស្ត្រ"}
              </button>
              <button 
                className={`btn ${formData.study_track === "Social Science Track" ? "primary" : "outline"}`}
                onClick={() => setFormData({...formData, study_track: "Social Science Track"})}
                style={{ flex: 1 }}
              >
                {lang === "en" ? "Social Science" : "ថ្នាក់សង្គម"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label className="label">{lang === "en" ? "What major do you want to study?" : "តើអ្នកចង់រៀនជំនាញអ្វី?"}</label>
            <input 
              type="text" 
              className="input" 
              placeholder={lang === "en" ? "Type to search majors..." : "វាយដើម្បីស្វែងរកជំនាញ..."}
              value={searchMajor}
              onChange={(e) => {
                setSearchMajor(e.target.value);
                setShowMajorSuggestions(true);
              }}
              onFocus={() => setShowMajorSuggestions(true)}
            />
            {showMajorSuggestions && searchMajor && (
              <div className="card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, padding: 0, maxHeight: "200px", overflowY: "auto" }}>
                {filteredMajors.map(m => (
                  <div 
                    key={m} 
                    style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee" }}
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
                  <div style={{ padding: "10px" }}>
                    <button className="btn outline sm" onClick={() => {
                      setFormData({...formData, intended_major: searchMajor});
                      setShowMajorSuggestions(false);
                    }}>
                      Use "{searchMajor}"
                    </button>
                  </div>
                )}
              </div>
            )}
            {formData.intended_major && <p style={{ fontSize: "14px", color: "var(--primary)", marginTop: "5px" }}>Selected: {formData.intended_major}</p>}
          </div>

          <button 
            className="btn primary" 
            onClick={handleNext} 
            disabled={!formData.study_track || !formData.intended_major}
            style={{ width: "100%" }}
          >
            {t.next}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card fade-in">
          <h2>{lang === "en" ? "Grades (BAC II)" : "និទ្ទេស (BAC II)"}</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>A=5, B=4, C=3, D=2, E=1, F=0</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            {['math', 'khmer', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography'].map(subj => (
              <div key={subj}>
                <label className="label" style={{ textTransform: "capitalize" }}>{subj}</label>
                <select 
                  className="input" 
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

          <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
            <button className="btn outline" onClick={handlePrev} style={{ flex: 1 }}>{t.back}</button>
            <button className="btn primary" onClick={handleNext} style={{ flex: 1 }}>{t.next}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card fade-in">
          <h2>{t.s3Title}</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>{t.s3Sub}</p>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {t.interests.map((i) => {
              const isSelected = formData.interests.includes(i.val);
              return (
                <button
                  key={i.val}
                  className={`btn ${isSelected ? "primary" : "outline"}`}
                  onClick={() => {
                    if (isSelected) {
                      setFormData({...formData, interests: formData.interests.filter(x => x !== i.val)});
                    } else if (formData.interests.length < 5) {
                      setFormData({...formData, interests: [...formData.interests, i.val]});
                    }
                  }}
                >
                  {i.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
            <button className="btn outline" onClick={handlePrev} style={{ flex: 1 }}>{t.back}</button>
            <button className="btn primary" onClick={handleNext} style={{ flex: 1 }}>{t.next}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card fade-in">
          <h2>{lang === "en" ? "Preferences" : "ចំណូលចិត្ត"}</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <label className="label">{t.locationLabel}</label>
            <select 
              className="input" 
              value={formData.province} 
              onChange={(e) => setFormData({...formData, province: e.target.value})}
            >
              <option value="">{t.locationAny}</option>
              {t.locations.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="label">{t.budgetLabel}</label>
            <select 
              className="input" 
              value={formData.budget_range} 
              onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
            >
              <option value="">{lang === "en" ? "Any" : "ណាមួយក៏បាន"}</option>
              {t.budgets.map(b => <option key={b.val} value={b.val}>{b.amount} ({b.desc})</option>)}
            </select>
          </div>

          {error && <div style={{ color: "red", padding: "10px", background: "#fee", borderRadius: "5px", marginBottom: "20px" }}>{error}</div>}

          <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
            <button className="btn outline" onClick={handlePrev} style={{ flex: 1 }} disabled={isSubmitting}>{t.back}</button>
            <button className="btn primary" onClick={handleSubmit} style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? "..." : (lang === "en" ? "Submit Survey" : "បញ្ជូនការស្ទង់មតិ")}
            </button>
          </div>
        </div>
      )}

      {step === 5 && prediction && (
        <div className="card fade-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎉</div>
          <h2>{lang === "en" ? "Thank You!" : "សូមអរគុណ!"}</h2>
          <p style={{ marginBottom: "20px" }}>{lang === "en" ? "Your survey has been recorded." : "ការស្ទង់មតិរបស់អ្នកត្រូវបានរក្សាទុក។"}</p>
          
          <div style={{ background: "var(--background-secondary)", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <h3 style={{ color: "var(--primary)" }}>{lang === "en" ? "AI Prediction based on your data:" : "ការព្យាករណ៍ AI ផ្អែកលើទិន្នន័យរបស់អ្នក៖"}</h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 0" }}>{prediction.top_major}</div>
            <p style={{ fontSize: "14px", color: "#555" }}>
              {lang === "en" ? prediction.all_predictions[0].explanation_en : prediction.all_predictions[0].explanation_kh}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="btn outline" onClick={handleDownloadResponse}>
              ⬇️ {lang === "en" ? "Download My Response (JSON)" : "ទាញយកចម្លើយរបស់ខ្ញុំ"}
            </button>
            <Link to="/" className="btn primary">
              {lang === "en" ? "Go Home" : "ទៅទំព័រដើម"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSurveyPage;
