import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionRoute from "./components/SubscriptionRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/olvide-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="/acerca-de" element={<About />} />
          <Route path="/ayuda" element={<Help />} />

          {/* Solo requieren sesión (cuenta activa) */}
          <Route path="/cuenta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/planes" element={<ProtectedRoute><Plans /></ProtectedRoute>} />

          {/* Requieren sesión + suscripción con acceso (si no, → /planes) */}
          <Route path="/entrenamientos" element={<SubscriptionRoute><Feed /></SubscriptionRoute>} />
          <Route path="/entrenamiento/:id" element={<SubscriptionRoute><TrainingDetail /></SubscriptionRoute>} />
          <Route path="/entrenamiento/:trainingId/sesion/:sessionId" element={<SubscriptionRoute><Steps /></SubscriptionRoute>} />
          <Route path="/entrenamiento/:trainingId/sesion/:sessionId/step/:stepId" element={<SubscriptionRoute><StepPlayer /></SubscriptionRoute>} />
          <Route path="/entrenador/:id" element={<SubscriptionRoute><CoachProfile /></SubscriptionRoute>} />
          <Route path="/mis-entrenamientos" element={<SubscriptionRoute><MyTrainings /></SubscriptionRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
