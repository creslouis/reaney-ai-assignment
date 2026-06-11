import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { apiFetch } from "../api";

export default function Chat() {
  const { lang, results, studentId, sessionId } = useApp();
  const t = T[lang];

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
      let reply;
      if (studentId && sessionId) {
        const data = await apiFetch("/api/v1/chat/send", {
          method: "POST",
          body: JSON.stringify({
            session_id: sessionId,
            student_id: studentId,
            message: text,
          }),
        });
        reply = data.reply;
      } else {
        reply = lang === "km"
          ? "សូមអភ័យទោស! លទ្ធផល backend មិនទាន់រួចរាល់ទេ។ សូមព្យាយាមម្ដងទៀត។"
          : "Sorry, the backend session is not ready yet. Please try again.";
      }
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
