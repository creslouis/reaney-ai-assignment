import { useState } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { apiFetch } from "../api";
import { cmsText } from "../cms";

const contributorTypes = [
  { value: "uni_student", emoji: "🎓" },
  { value: "graduate", emoji: "📘" },
  { value: "working_professional", emoji: "💼" },
];

export default function ExperiencePage() {
  const { lang, cmsBundle } = useApp();
  const t = T[lang];
  const [form, setForm] = useState({
    contributor_type: "uni_student",
    name: "",
    email: "",
    current_major: "",
    university: "",
    year_of_study: "",
    job_title: "",
    years_of_experience: "",
    province: "",
    satisfaction_score: "",
    would_recommend: "yes",
    high_school_interests: [],
    why_choose_text: "",
    challenges_text: "",
    advice_text: "",
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleInterest = (value) => {
    setForm((prev) => ({
      ...prev,
      high_school_interests: prev.high_school_interests.includes(value)
        ? prev.high_school_interests.filter((item) => item !== value)
        : [...prev.high_school_interests, value],
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      await apiFetch("/api/v1/experience/submit", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          year_of_study: form.year_of_study ? Number(form.year_of_study) : null,
          years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
          satisfaction_score: form.satisfaction_score ? Number(form.satisfaction_score) : null,
          would_recommend: form.would_recommend === "yes",
        }),
      });
      setStatus("success");
      setForm({
        contributor_type: "uni_student",
        name: "",
        email: "",
        current_major: "",
        university: "",
        year_of_study: "",
        job_title: "",
        years_of_experience: "",
        province: "",
        satisfaction_score: "",
        would_recommend: "yes",
        high_school_interests: [],
        why_choose_text: "",
        challenges_text: "",
        advice_text: "",
      });
    } catch {
      setStatus("error");
    }
    setSubmitting(false);
  };

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{cmsText(cmsBundle, "content.experience", "title_en", "title_km", lang, t.expTitle)}</h2>
          <p className="sub">{cmsText(cmsBundle, "content.experience", "sub_en", "sub_km", lang, t.expSub)}</p>
        </div>

        <div className="experience-card">
          <div className="section-title">{t.expWho}</div>
          <div className="strand-grid exp-grid-3">
            {contributorTypes.map((item) => (
              <div
                key={item.value}
                className={`strand-card${form.contributor_type === item.value ? " selected" : ""}`}
                onClick={() => setField("contributor_type", item.value)}
              >
                <div className="strand-emoji">{item.emoji}</div>
                <div className="strand-name">{t.expContributorLabels[item.value]}</div>
              </div>
            ))}
          </div>

          <div className="exp-form-grid">
            <input className="form-input" placeholder={t.fieldName} value={form.name} onChange={(e) => setField("name", e.target.value)} />
            <input className="form-input" placeholder={t.fieldEmail} value={form.email} onChange={(e) => setField("email", e.target.value)} />
            <input className="form-input" placeholder={t.expMajor} value={form.current_major} onChange={(e) => setField("current_major", e.target.value)} />
            <input className="form-input" placeholder={t.expUniversity} value={form.university} onChange={(e) => setField("university", e.target.value)} />
            <input className="form-input" placeholder={t.expYearStudy} value={form.year_of_study} onChange={(e) => setField("year_of_study", e.target.value)} />
            <input className="form-input" placeholder={t.expJobTitle} value={form.job_title} onChange={(e) => setField("job_title", e.target.value)} />
            <input className="form-input" placeholder={t.expYearsWork} value={form.years_of_experience} onChange={(e) => setField("years_of_experience", e.target.value)} />
            <input className="form-input" placeholder={t.expProvince} value={form.province} onChange={(e) => setField("province", e.target.value)} />
            <input className="form-input" placeholder={t.expSatisfaction} value={form.satisfaction_score} onChange={(e) => setField("satisfaction_score", e.target.value)} />
            <select className="form-select" value={form.would_recommend} onChange={(e) => setField("would_recommend", e.target.value)}>
              <option value="yes">{t.expRecommendYes}</option>
              <option value="no">{t.expRecommendNo}</option>
            </select>
          </div>

          <div className="section-title" style={{ marginTop: "1.25rem" }}>{t.expInterests}</div>
          <div className="tag-cloud">
            {t.interests.map((item) => (
              <span
                key={item.val}
                className={`interest-tag${form.high_school_interests.includes(item.val) ? " selected" : ""}`}
                onClick={() => toggleInterest(item.val)}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="section-title">{t.expStory}</div>
          <textarea className="form-input exp-textarea" placeholder={t.expWhyChoose} value={form.why_choose_text} onChange={(e) => setField("why_choose_text", e.target.value)} />
          <textarea className="form-input exp-textarea" placeholder={t.expChallenges} value={form.challenges_text} onChange={(e) => setField("challenges_text", e.target.value)} />
          <textarea className="form-input exp-textarea" placeholder={t.expAdvice} value={form.advice_text} onChange={(e) => setField("advice_text", e.target.value)} />

          {status === "success" && <div className="experience-status success">{t.expSuccess}</div>}
          {status === "error" && <div className="experience-status error">{t.expError}</div>}

          <div className="step-nav">
            <div />
            <button className="btn-submit" disabled={submitting} onClick={submit}>{submitting ? t.loadingTitle : t.expSubmit}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
