/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  apiFetch,
  authHeaders,
  getStoredAdminToken,
  getStoredRefreshToken,
  setStoredAdminToken,
  setStoredRefreshToken,
} from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState("km");
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(null);

  const [strand, setStrand] = useState(null);
  const [bacStatus, setBacStatus] = useState(null);
  const [strongSubjects, setStrongSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [interests, setInterests] = useState([]);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState(null);
  const [results, setResults] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState("");
  const [cmsBundle, setCmsBundle] = useState({ settings: {}, legal: {} });
  const [adminToken, setAdminTokenState] = useState(getStoredAdminToken());
  const [adminRefreshToken, setAdminRefreshTokenState] = useState(getStoredRefreshToken());
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    let active = true;
    apiFetch("/api/v1/cms/public")
      .then((data) => {
        if (!active) return;
        setCmsBundle(data);
        const colors = data?.settings?.["theme.colors"] || {};
        Object.entries(colors).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key.replace(/_/g, "-")}`, value);
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Restore admin user info on page refresh if a token is stored
  useEffect(() => {
    if (!adminToken || adminUser) return;
    let active = true;
    apiFetch("/api/v1/auth/me", { headers: authHeaders(adminToken) })
      .then((data) => { if (active) setAdminUser(data); })
      .catch(() => {
        // Token is invalid – clear it
        if (active) {
          setStoredAdminToken("");
          setStoredRefreshToken("");
          setAdminTokenState("");
          setAdminRefreshTokenState("");
        }
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const setAdminToken = (token) => {
    setStoredAdminToken(token);
    setAdminTokenState(token);
  };

  const setAdminRefreshToken = (token) => {
    setStoredRefreshToken(token);
    setAdminRefreshTokenState(token);
  };

  const logoutAdmin = async () => {
    try {
      if (adminRefreshToken) {
        await apiFetch("/api/v1/auth/logout", {
          method: "POST",
          headers: authHeaders(adminToken),
          body: JSON.stringify({ refresh_token: adminRefreshToken }),
        });
      }
    } catch {
      // Best effort logout.
    }
    setAdminToken("");
    setAdminRefreshToken("");
    setAdminUser(null);
  };

  const refreshAdminSession = async () => {
    if (!adminRefreshToken) return null;
    const data = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: adminRefreshToken }),
    });
    setAdminToken(data.access_token || "");
    if (data.refresh_token) setAdminRefreshToken(data.refresh_token);
    if (data.user) setAdminUser(data.user);
    return data;
  };

  const adminRequest = async (path, options = {}) => {
    const request = async (token) => apiFetch(path, { ...options, headers: { ...(options.headers || {}), ...authHeaders(token || adminToken) } });
    try {
      return await request(adminToken);
    } catch (error) {
      if (!adminRefreshToken) throw error;
      try {
        const refreshed = await refreshAdminSession();
        return await request(refreshed?.access_token || getStoredAdminToken());
      } catch {
        await logoutAdmin();
        throw error;
      }
    }
  };

  const toggleInterest = (val) => {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : prev.length < 5 ? [...prev, val] : prev
    );
  };

  // ← this was missing
  const toggleStrongSubject = (id) => {
    setStrongSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const setGrade = (subjectId, grade) => {
    setGrades((prev) => ({ ...prev, [subjectId]: grade }));
  };

  const restart = () => {
    setStrand(null); setBacStatus(null); setStrongSubjects([]); // ← added
    setGrades({}); setInterests([]);
    setLocation(""); setBudget(null); setResults([]); setStep(1);
    setStudentId(null); setSessionId(null); setGeminiSummary("");
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, step, setStep, showModal, setShowModal,
      strand, setStrand, bacStatus, setBacStatus,
      strongSubjects, toggleStrongSubject, // ← toggleStrongSubject not setStrongSubjects
      grades, setGrade, interests, toggleInterest,
      location, setLocation, budget, setBudget, results, setResults,
      studentId, setStudentId, sessionId, setSessionId, geminiSummary, setGeminiSummary,
      cmsBundle, setCmsBundle,
      adminToken, setAdminToken, adminRefreshToken, setAdminRefreshToken,
      adminUser, setAdminUser, adminRequest, refreshAdminSession, logoutAdmin,
      restart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
