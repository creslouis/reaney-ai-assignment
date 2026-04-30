import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

function buildSystemPrompt({ strand, grades, interests, location, budget, results }) {
  const strandLabel = { science: "Science", social: "Social Science" }[strand] || "Unknown";
  const gradesList = Object.entries(grades).map(([k, v]) => `${k}: ${v}`).join(", ") || "Not provided";
  const interestsList = interests.join(", ") || "Not specified";
  const budgetLabel = { low: "$0–$500/year (public/scholarship)", medium: "$500–$1,500/year", high: "$1,500–$3,000/year", any: "No budget limit" }[budget] || "Flexible";
  const majorNames = results.map((r, i) => `#${i + 1}: ${r.major} (${r.match}% match)`).join("\n");
  const uniList = results.flatMap((r) => (r.universities || []).map((u) => `${u.name} (${u.type}, ${u.tuition})`)).join(", ");

  return `You are Sok, a friendly AI academic advisor for Cambodian Grade 12 students. You're like a smart older student — casual, warm, encouraging.

Student profile:
- BAC II Strand: ${strandLabel}
- Grades: ${gradesList}
- Interests: ${interestsList}
- Location: ${location || "Any"}
- Budget: ${budgetLabel}

Their recommended majors (already shown):
${majorNames}

Relevant universities: ${uniList}

Rules:
1. Answer questions about their recommended majors
2. Compare majors when asked
3. Explain career paths in Cambodia
4. Give advice on university applications (deadlines, documents, entrance exams)
5. Be honest — if a major is tough given their grades, say so kindly
6. Reply in the SAME language the student uses (English or Khmer). If they write Khmer, respond fully in Khmer.
7. Keep replies concise — max 3–4 short paragraphs
8. Use emojis naturally
9. Never make up university fees — say "I'd recommend checking the university website to confirm"`;
}

export default function Chat() {
  const { lang, strand, grades, interests, location, budget, results } = useApp();
  const t = T[lang];

  const topMajor = lang === "km" ? results[0]?.major_kh : results[0]?.major || "your top major";
  const welcome = t.chatWelcomeFn(lang === "km" ? (results[0]?.major_kh || results[0]?.major) : (results[0]?.major || "your top major"));
  
  const [messages, setMessages] = useState([{ role: "ai", text: welcome }]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const appendMsg = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const send = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    appendMsg("user", text);
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);
    setTyping(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt({ strand, grades, interests, location, budget, results }),
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map((b) => b.text || "").join("") || (lang === "km" ? "សូមអភ័យទោស! មានបញ្ហា។ សូមសាកម្ដងទៀត!" : "Sorry, something went wrong. Try again!");
      setTyping(false);
      appendMsg("ai", reply);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      if (newHistory.length === 1) setShowFollowup(true);
    } catch {
      setTyping(false);
      appendMsg("ai", lang === "km" ? "😅 មានបញ្ហាការតភ្ជាប់! សូមសាកម្ដងទៀត។" : "😅 Connection issue! Try asking again.");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const renderText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const quickReplies = showFollowup ? t.followupReplies : t.quickReplies;

  return (
    <div className="chat-section visible">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="advisor-avatar">🤖</div>
          <div className="advisor-info">
            <div className="name">{t.chatName}</div>
            <div className="status">{t.chatStatus}</div>
          </div>
        </div>
        <div className="chat-lang-hint">{t.chatLangHint}</div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-avatar">{m.role === "ai" ? "🤖" : "👤"}</div>
            <div style={{ maxWidth: "78%" }}>
              <div
                className="msg-bubble"
                dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
              />
              <div className={`msg-time${m.role === "user" ? " user" : ""}`}>{now()}</div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="msg ai">
            <div className="msg-avatar">🤖</div>
            <div className="msg-bubble" style={{ padding: "0.7rem 1rem" }}>
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="quick-replies">
        {quickReplies.map((r, i) => (
          <button key={i} className="qr-btn" onClick={() => {
            send(r.label);
            setShowFollowup(true);
          }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-input"
          rows={1}
          placeholder={t.chatPlaceholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onInput={autoResize}
          disabled={typing}
        />
        <button
          className="chat-send-btn"
          onClick={() => send()}
          disabled={typing || !input.trim()}
        >➤</button>
      </div>
    </div>
  );
}
