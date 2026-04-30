import { createContext, useContext, useState } from "react";

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
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, step, setStep, showModal, setShowModal,
      strand, setStrand, bacStatus, setBacStatus,
      strongSubjects, toggleStrongSubject, // ← toggleStrongSubject not setStrongSubjects
      grades, setGrade, interests, toggleInterest,
      location, setLocation, budget, setBudget, results, setResults, restart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);