import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function LegalPage() {
  const { slug } = useParams();
  const { cmsBundle } = useApp();
  const doc = cmsBundle?.legal?.[slug];

  return (
    <main className="main">
      <div className="step-panel active">
        <div className="step-heading">
          <h2>{doc?.title || slug}</h2>
          <p className="sub">Version {doc?.version || "-"}</p>
        </div>
        <div className="summary-card legal-card">
          <ReactMarkdown>{doc?.content_markdown || "Document not found."}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
