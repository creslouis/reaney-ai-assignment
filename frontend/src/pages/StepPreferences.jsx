import { useApp } from "../context/AppContext";
import { T, FALLBACK_RESULTS } from "../data/translations";
import { apiFetch } from "../api";

export default function StepPreferences() {
  const {
    lang,
    strand,
    bacStatus,
    strongSubjects,
    grades,
    interests,
    location,
    setLocation,
    budget,
    setBudget,
    setStep,
    setResults,
    setStudentId,
    setSessionId,
    setGeminiSummary,
  } = useApp();
  const t = T[lang];

  const mergeResultsWithInsights = (data) => {
    const baseResults = data.results || data.recommendation?.recommended_majors || FALLBACK_RESULTS;
    const majorDetails = new Map((data.recommendation?.recommended_majors || []).map((item) => [item.major, item]));

    return baseResults.map((item) => ({
      ...item,
      experience_insights: majorDetails.get(item.major)?.experience_insights || [],
    }));
  };

  const handleSubmit = async () => {
    setStep("loading");

    try {
      const now = Date.now();
      const submitGrades = bacStatus === "done"
        ? grades
        : strongSubjects.reduce((acc, subject) => ({ ...acc, [subject]: "A" }), {});

      const payload = {
        name: "Guest Student",
        email: `guest-${now}@example.com`,
        phone: null,
        grade_level: bacStatus === "done" ? "BacII" : "Grade12",
        province: location || null,
        budget_range: budget || "any",
        grades: submitGrades,
        interests,
        personality: {
          analytical_score: strand === "science" ? 4 : 3,
          creative_score: strand === "social" ? 4 : 3,
          people_oriented_score: interests.includes("social") || interests.includes("education") ? 4 : 3,
          detail_oriented_score: 3,
        },
      };

      const data = await apiFetch("/api/v1/students/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setResults(mergeResultsWithInsights(data));
      setStudentId(data.student_id);
      setSessionId(data.session_id);
      setGeminiSummary(data.gemini_summary || "");
    } catch {
      setResults(FALLBACK_RESULTS);
      setStudentId(null);
      setSessionId(null);
      setGeminiSummary("");
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
