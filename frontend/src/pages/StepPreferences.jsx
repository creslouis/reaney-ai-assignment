import { useApp } from "../context/AppContext";
import { T, FALLBACK_RESULTS } from "../data/translations";

export default function StepPreferences() {
  const { lang, strand, bacStatus, strongSubjects, grades, interests, location, setLocation, budget, setBudget, setStep, setResults } = useApp();
  const t = T[lang];

  const handleSubmit = async () => {
    setStep("loading");

    const gradesSummary = bacStatus === "done"
      ? Object.entries(grades).map(([k, v]) => `${k}: ${v}`).join(", ") || "Not provided"
      : `Student has NOT yet taken BAC II. Strong/favourite subjects: ${strongSubjects.join(", ") || "not specified"}`;
  
    const interestsList = interests.join(", ") || "general";
    const budgetLabel = { low: "$0–$500/year", medium: "$500–$1,500/year", high: "$1,500–$3,000/year", any: "no budget limit" }[budget] || "flexible";
    const strandLabel = { science: "Science", social: "Social Science" }[strand];
    
    const prompt = `You are an academic advisor for Cambodian university students. A Grade 12 student is exploring their university options.

Student Profile:
- BAC II Strand: ${strandLabel}
- BAC II Status: ${bacStatus === "done" ? "Completed" : "Not yet taken (still in school)"}
- ${bacStatus === "done" ? `Grades (A=Excellent, B=Good, C=Average, D=Below Average, E=Poor, F=Fail): ${gradesSummary}` : `Strong subjects: ${gradesSummary}`}
- Personal Interests: ${interestsList}
- Location Preference: ${location || "any province"}
- Annual Tuition Budget: ${budgetLabel}

Respond ONLY with a valid JSON array of exactly 4 recommended university majors. No markdown, no extra text:
[
  {
    "major": "Major Name in English",
    "major_kh": "ឈ្មោះជំនាញជាភាសាខ្មែរ",
    "match": 92,
    "why_en": "2-3 sentence explanation of why this major fits their grades and interests",
    "why_kh": "ការពន្យល់ ២-៣ ប្រយោគជាភាសាខ្មែរ",
    "universities": [
      { "name": "University Name", "type": "public", "tuition": "$200–$400/year", "rank": "Top public university", "location": "Phnom Penh" },
      { "name": "Another University", "type": "private", "tuition": "$800–$1,200/year", "rank": "Well-established private", "location": "Phnom Penh" }
    ]
  }
]

Use REAL Cambodian universities: Royal University of Phnom Penh (RUPP), Royal University of Law and Economics (RULE), National University of Management (NUM), Institute of Technology of Cambodia (ITC), University of Health Sciences (UHS), Pannasastra University of Cambodia (PUC), Build Bright University (BBU), Cambodia University of Technology and Science (CUT&S), American University of Phnom Penh (AUPP), Paragon International University, University of Cambodia (UC). Match universities to the student's budget and location.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content.map((i) => i.text || "").join("").replace(/```json|```/g, "").trim();
      setResults(JSON.parse(text));
    } catch {
      setResults(FALLBACK_RESULTS);
    }
    setStep(6);
  };

  return (
    <div className="step-panel active">
      <div className="step-heading">
        <h2>{t.s4Title}</h2>
        <p className="sub">{t.s4Sub}</p>
      </div>

      {/* Location */}
      <div className="form-group">
        <label className="form-label">{t.locationLabel}</label>
        <div className="select-wrap">
          <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">{t.locationAny}</option>
            {t.locations.map((loc) => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget */}
      <div className="form-group">
        <label className="form-label">{t.budgetLabel}</label>
        <div className="budget-grid">
          {t.budgets.map((b) => (
            <div
              key={b.val}
              className={`budget-option${budget === b.val ? " selected" : ""}`}
              onClick={() => setBudget(b.val)}
            >
              <div className="amount">{b.amount}</div>
              <div className="label">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-nav">
        <button className="btn-back" onClick={() => setStep(3)}>← {t.back}</button>
        <button className="btn-submit" onClick={handleSubmit}>
          {t.findMajors}
        </button>
      </div>
    </div>
  );
}
