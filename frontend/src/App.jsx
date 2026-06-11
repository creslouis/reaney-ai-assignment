import { AppProvider, useApp } from "./context/AppContext";
import { Topbar, ProgressBar } from "./components/Nav";
import Modal from "./components/Modal";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import StepStrand from "./pages/StepStrand";
import StepBacStatus from "./pages/StepBacStatus";
import StepGrades from "./pages/StepGrades";
import StepInterests from "./pages/StepInterests";
import StepPreferences from "./pages/StepPreferences";
import StepLoading from "./pages/StepLoading";
import StepResults from "./pages/StepResults";
import ExperiencePage from "./pages/ExperiencePage";
import ExperienceAdminPage from "./pages/ExperienceAdminPage";
import MlAdminPage from "./pages/MlAdminPage";
import UniversityAdminPage from "./pages/UniversityAdminPage";
import CmsAdminPage from "./pages/CmsAdminPage";
import LegalPage from "./pages/LegalPage";
import Footer from "./components/Footer";

function WizardRouter() {
  const { step } = useApp();
  return (
    <main className="main">
      {step === 1 && <StepStrand />}
      {step === 2 && <StepBacStatus />}
      {step === 3 && <StepGrades />}
      {step === 4 && <StepInterests />}
      {step === 5 && <StepPreferences />}
      {step === "loading" && <StepLoading />}
      {step === 6 && <StepResults />}
    </main>
  );
}


function AppRoutes() {
  const location = useLocation();
  const isWizard = location.pathname === "/";

  return (
    <>
      <Topbar />
      {isWizard && <ProgressBar />}
      <Routes>
        <Route path="/" element={<WizardRouter />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/admin/experience" element={<ExperienceAdminPage />} />
        <Route path="/admin/ml" element={<MlAdminPage />} />
        <Route path="/admin/universities" element={<UniversityAdminPage />} />
        <Route path="/admin/cms" element={<CmsAdminPage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <Modal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
