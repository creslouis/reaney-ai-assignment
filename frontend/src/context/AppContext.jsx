import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState("km"); // Khmer primary
  const [step, setStep] = useState(1);    // 1-4 = form, "loading" = loading, 5 = results
  const [showModal, setShowModal] = useState(null); // null | "login" | "register" | "save"

  // Form state
  const [strand, setStrand] = useState(null);
  const [grades, setGrades] = useState({});
  const [interests, setInterests] = useState([]);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState(null);
  const [results, setResults] = useState([]);

  const toggleInterest = (val) => {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : prev.length < 5 ? [...prev, val] : prev
    );
  };

  const setGrade = (subjectId, grade) => {
    setGrades((prev) => ({ ...prev, [subjectId]: grade }));
  };

  const restart = () => {
    setStrand(null); setGrades({}); setInterests([]);
    setLocation(""); setBudget(null); setResults([]); setStep(1);
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, step, setStep, showModal, setShowModal,
      strand, setStrand, grades, setGrade, interests, toggleInterest,
      location, setLocation, budget, setBudget, results, setResults, restart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
