import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "./Header";
import Footer from "./Footer";

// Ruta de contenido: requiere sesión Y una suscripción con acceso. Sin sesión →
// /login; con sesión pero sin suscripción → /planes (para adquirir una).
const SubscriptionRoute = ({ children }) => {
  const { isAuthenticated, hasSubscription } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (hasSubscription === null) {
    return (
      <div className="light">
        <Header />
        <main className="pt-b-108"><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  if (!hasSubscription) return <Navigate to="/planes" replace />;

  return children;
};

export default SubscriptionRoute;
