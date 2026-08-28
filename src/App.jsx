import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Feed from "./pages/Feed";
import TrainingDetail from "./pages/TrainingDetail";
import Steps from "./pages/Steps";
import StepPlayer from "./pages/StepPlayer";
import CoachProfile from "./pages/CoachProfile";
import Account from "./pages/Account";
import MyTrainings from "./pages/MyTrainings";
import Settings from "./pages/Settings";
import Plans from "./pages/Plans";
import Help from "./pages/Help";
import Faqs from "./pages/Faqs";
import Privacy from "./pages/Privacy";
import About from "./pages/About";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/olvide-password" element={<ForgotPassword />} />
          <Route path="/restablecer-password" element={<ResetPassword />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="/acerca-de" element={<About />} />
          <Route path="/ayuda" element={<Help />} />

          {/* Requieren sesión */}
          <Route path="/entrenamientos" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/entrenamiento/:id" element={<ProtectedRoute><TrainingDetail /></ProtectedRoute>} />
          <Route path="/entrenamiento/:trainingId/sesion/:sessionId" element={<ProtectedRoute><Steps /></ProtectedRoute>} />
          <Route path="/entrenamiento/:trainingId/sesion/:sessionId/step/:stepId" element={<ProtectedRoute><StepPlayer /></ProtectedRoute>} />
          <Route path="/entrenador/:id" element={<ProtectedRoute><CoachProfile /></ProtectedRoute>} />
          <Route path="/cuenta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/mis-entrenamientos" element={<ProtectedRoute><MyTrainings /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/planes" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
