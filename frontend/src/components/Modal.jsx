import { useApp } from "../context/AppContext";
import { T } from "../data/translations";

export default function Modal() {
  const { lang, showModal, setShowModal } = useApp();
  const t = T[lang];

  if (!showModal) return null;

  const close = () => setShowModal(null);

  let title = "";
  let body = null;

  if (showModal === "login") {
    title = t.modalLoginTitle;
    body = (
      <>
        <input className="form-input" placeholder={t.fieldEmail} style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" type="password" placeholder={t.fieldPassword} style={{ marginBottom: "1.25rem" }} />
        <button className="btn-submit" style={{ width: "100%", justifyContent: "center" }}>{t.btnLogin}</button>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "center", marginTop: "0.75rem" }}>
          {t.noAccount}{" "}
          <button onClick={() => setShowModal("register")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>
            {t.signupFree}
          </button>
        </p>
      </>
    );
  } else if (showModal === "register" || showModal === "save") {
    title = showModal === "save" ? t.modalSaveTitle : t.modalRegTitle;
    const sub = showModal === "save" ? t.modalSaveSub : t.modalRegSub;
    body = (
      <>
        <p style={{ fontSize: "0.83rem", color: "var(--muted)", marginBottom: "1rem" }}>{sub}</p>
        <input className="form-input" placeholder={t.fieldName} style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" placeholder={t.fieldEmail} style={{ marginBottom: "0.75rem" }} />
        <input className="form-input" type="password" placeholder={t.fieldNewPassword} style={{ marginBottom: "1.25rem" }} />
        <button className="btn-submit" style={{ width: "100%", justifyContent: "center" }}>{t.btnCreate}</button>
      </>
    );
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={close}>×</button>
        </div>
        {body}
      </div>
    </div>
  );
}
