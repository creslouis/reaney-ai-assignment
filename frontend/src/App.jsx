import { AppProvider, useApp } from "./context/AppContext";
import { Topbar, ProgressBar } from "./components/Nav";
import Modal from "./components/Modal";
import StepStrand from "./pages/StepStrand";
import StepBacStatus from "./pages/StepBacStatus";
import StepGrades from "./pages/StepGrades";
import StepInterests from "./pages/StepInterests";
import StepPreferences from "./pages/StepPreferences";
import StepLoading from "./pages/StepLoading";
import StepResults from "./pages/StepResults";

function Router() {
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

export default function App() {
  return (
    <AppProvider>
      <Topbar />
      <ProgressBar />
      <Router />
      <Modal />
    </AppProvider>
  );
}
