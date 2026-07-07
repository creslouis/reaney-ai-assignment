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
  "International Relations"
];

const PROVINCES = [
  "Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham", "Kandal", 
  "Takeo", "Kampot", "Prey Veng", "Svay Rieng", "Pursat", "Kratie", 
  "Kampong Thom", "Kampong Speu", "Kampong Chhnang", "Koh Kong", 
  "Mondulkiri", "Ratanakiri", "Stung Treng", "Pailin", "Oddar Meanchey"
];

export default function StudentSurveyPage() {
  const { lang, adminToken } = useApp();
  const t = T[lang];
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    respondent_current_major: "",
    respondent_university: "",
    respondent_year: 1,
    respondent_satisfaction: 3,
    hs_math_score: 0,
    hs_khmer_score: 0,
    hs_english_score: 0,
    hs_science_score: 0,
    hs_biology_score: 0,
    hs_history_score: 0,
    hs_geography_score: 0,
    hs_physics_score: 0,
    hs_chemistry_score: 0,
    hs_interests: [],
    hs_province: "",
    hs_budget_range: "",
    hs_personality: {
      analytical_score: 3.0,
      creative_score: 3.0,
      people_oriented_score: 3.0,
      detail_oriented_score: 3.0,
    },
    would_recommend: true
  });

  const [searchMajor, setSearchMajor] = useState("");
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filteredMajors = MAJORS.filter(m => m.toLowerCase().includes(searchMajor.toLowerCase()));

  const handleSubmit = async () => {
    if (!formData.respondent_current_major || !formData.respondent_university) {
      setError(lang === "en" ? "Please fill in all required fields (Major and University)." : "សូមបំពេញចន្លោះដែលចាំបាច់ (ជំនាញ និងសាកលវិទ្យាល័យ)។");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // Send to /api/v1/survey/manual as required for ML training data
      const payload = {
        source: "web_form",
        ...formData,
        actual_major: formData.respondent_current_major // Map this for the ML schema
      };

      // Since the route expects AdminAuth, we send the admin token if available. 
      // If we want public submissions, we would need to adjust the backend route. 
      // Assuming this is used properly in the admin context or the backend was updated.
      // (The instructions specify to POST to this endpoint)
      
      const res = await apiFetch("/api/v1/survey/manual", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: adminToken ? { "Authorization": `Bearer ${adminToken}` } : {}
      });
      
      if (res.success || res.id) {
        setStep(2); 
      } else {
        throw new Error("Submission failed without error message");
      }
    } catch (err) {
      setError(err.message || "Failed to submit survey. Please ensure you are logged in as admin if required.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (val) => {
    setFormData(prev => {
      const isSelected = prev.hs_interests.includes(val);
      if (isSelected) {
        return { ...prev, hs_interests: prev.hs_interests.filter(x => x !== val) };
      } else if (prev.hs_interests.length < 5) {
        return { ...prev, hs_interests: [...prev.hs_interests, val] };
      }
      return prev;
    });
  };
  
  const handleScore = (subj, val) => {
    setFormData(prev => ({...prev, [`hs_${subj}_score`]: val}));
  };

  const handlePersonality = (trait, val) => {
    setFormData(prev => ({
      ...prev, 
      hs_personality: {
        ...prev.hs_personality,
        [`${trait}_score`]: parseFloat(val)
      }
    }));
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{lang === "en" ? "Data Collection for ML Training" : "ការប្រមូលទិន្នន័យសម្រាប់ ML"}</h2>
          <p className="sub">{lang === "en" ? "Help train our AI by sharing your past grades and current major." : "ជួយបង្ហាត់ AI របស់យើងដោយចែករំលែកពិន្ទុវិទ្យាល័យ និងជំនាញបច្ចុប្បន្នរបស់អ្នក។"}</p>
        </div>

        {step === 1 && (
          <div className="experience-card">
            
            <div className="section-title">{lang === "en" ? "Current University Profile" : "ប្រវត្តិសាកលវិទ្យាល័យបច្ចុប្បន្ន"}</div>
            
            <div className="exp-form-grid" style={{ marginBottom: "1.5rem" }}>
              <div style={{ position: "relative" }}>
                <label className="form-label">{lang === "en" ? "Your Current Major *" : "ជំនាញបច្ចុប្បន្នរបស់អ្នក *"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={lang === "en" ? "Search majors..." : "ស្វែងរកជំនាញ..."}
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
                          setFormData({...formData, respondent_current_major: m});
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
                          setFormData({...formData, respondent_current_major: searchMajor});
                          setShowMajorSuggestions(false);
                        }}>
                          Use "{searchMajor}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {formData.respondent_current_major && <p style={{ fontSize: "14px", color: "var(--primary)", marginTop: "8px", fontWeight: "500" }}>Selected: {formData.respondent_current_major}</p>}
              </div>
              
              <div>
                <label className="form-label">{lang === "en" ? "University Name *" : "ឈ្មោះសាកលវិទ្យាល័យ *"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.respondent_university}
                  onChange={(e) => setFormData({...formData, respondent_university: e.target.value})}
                  placeholder="e.g. RUPP, ITC"
                />
              </div>
            </div>

            <div className="exp-form-grid">
              <div>
                <label className="form-label">{lang === "en" ? "Year of Study" : "ឆ្នាំសិក្សា"}</label>
                <select className="form-select" value={formData.respondent_year} onChange={(e) => setFormData({...formData, respondent_year: parseInt(e.target.value)})}>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              
              <div>
                <label className="form-label">{lang === "en" ? "Satisfaction (1-5)" : "ការពេញចិត្ត (1-5)"}</label>
                <select className="form-select" value={formData.respondent_satisfaction} onChange={(e) => setFormData({...formData, respondent_satisfaction: parseInt(e.target.value)})}>
                  {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={formData.would_recommend}
                  onChange={(e) => setFormData({...formData, would_recommend: e.target.checked})}
                  style={{ width: "18px", height: "18px" }}
                />
                {lang === "en" ? "I would recommend this major to others" : "ខ្ញុំសូមណែនាំជំនាញនេះដល់អ្នកដទៃ"}
              </label>
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "High School Grades (BAC II)" : "ពិន្ទុវិទ្យាល័យ (BAC II)"}</div>
            <div className="grade-table" style={{ marginTop: "1rem" }}>
              <div className="grade-table-header">Subject | Grade</div>
              {['math', 'khmer', 'english', 'science', 'biology', 'history', 'geography', 'physics', 'chemistry'].map(subj => (
                <div className="grade-row" key={subj}>
                  <div style={{ textTransform: "capitalize" }}>{subj.replace("_", " ")}</div>
                  <div className="grade-select">
                    {[{l:'A', v:95}, {l:'B', v:85}, {l:'C', v:75}, {l:'D', v:65}, {l:'E', v:55}, {l:'F', v:45}].map(g => (
                      <button 
                        key={g.l}
                        className={`grade-btn ${formData[`hs_${subj}_score`] === g.v ? ` sel-${g.l}` : ""}`}
                        onClick={() => handleScore(subj, g.v)}
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "High School Interests" : "ចំណាប់អារម្មណ៍វិទ្យាល័យ"}</div>
            <div className="tag-cloud">
              {t.interests.map((item) => (
                <span
                  key={item.val}
                  className={`interest-tag${formData.hs_interests.includes(item.val) ? " selected" : ""}`}
                  onClick={() => toggleInterest(item.val)}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "Preferences & Location" : "ចំណូលចិត្ត & ទីតាំង"}</div>
            <div className="exp-form-grid">
              <div>
                <label className="form-label">{lang === "en" ? "High School Province" : "ខេត្តវិទ្យាល័យ"}</label>
                <select 
                  className="form-select" 
                  value={formData.hs_province} 
                  onChange={(e) => setFormData({...formData, hs_province: e.target.value})}
                >
                  <option value="">{t.locationAny}</option>
                  {PROVINCES.map(p => {
                    const val = p.toLowerCase().replace(" ", "_");
                    return <option key={val} value={val}>{p}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="form-label">{lang === "en" ? "Budget Range" : "កម្រិតថវិកា"}</label>
                <select 
                  className="form-select" 
                  value={formData.hs_budget_range} 
                  onChange={(e) => setFormData({...formData, hs_budget_range: e.target.value})}
                >
                  <option value="">{lang === "en" ? "Any" : "ណាមួយក៏បាន"}</option>
                  <option value="public">Public / Low ($0-$500)</option>
                  <option value="scholarship">Scholarship Needed</option>
                  <option value="private">Private / Medium-High ($500+)</option>
                </select>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: "2rem" }}>{lang === "en" ? "Personality Traits" : "បុគ្គលិកលក្ខណៈ"}</div>
            <div className="exp-form-grid">
              {['analytical', 'creative', 'people_oriented', 'detail_oriented'].map(trait => (
                <div key={trait}>
                  <label className="form-label" style={{ textTransform: "capitalize", display: "flex", justifyContent: "space-between" }}>
                    <span>{trait.replace("_", " ")}</span>
                    <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{formData.hs_personality[`${trait}_score`]}</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="5" step="0.5" 
                    style={{ width: "100%", accentColor: "var(--primary)" }}
                    value={formData.hs_personality[`${trait}_score`]}
                    onChange={(e) => handlePersonality(trait, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {error && <div className="experience-status error" style={{ marginTop: "1.5rem", padding: "12px", background: "#ffebee", color: "#c62828", borderRadius: "8px" }}>{error}</div>}

            <div className="step-nav" style={{ marginTop: "2rem" }}>
              <div />
              <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (lang === "en" ? "Submitting..." : "កំពុងបញ្ជូន...") : (lang === "en" ? "Submit Data" : "បញ្ជូនទិន្នន័យ")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="experience-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>{lang === "en" ? "Thank You!" : "សូមអរគុណ!"}</h2>
            <p className="sub" style={{ marginBottom: "2rem" }}>
              {lang === "en" 
                ? "Your data has been submitted successfully and will be used to train our ML model." 
                : "ទិន្នន័យរបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ ហើយនឹងត្រូវប្រើដើម្បីបង្ហាត់ ML របស់យើង។"}
            </p>
            
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button className="btn-submit" onClick={() => setStep(1)} style={{ background: "var(--primary-dark)" }}>
                {lang === "en" ? "Submit Another" : "បញ្ជូនមួយទៀត"}
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
