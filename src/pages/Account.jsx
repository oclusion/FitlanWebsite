import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import userService from "../services/userService";
import subscriptionService, { hasSubscriptionAccess } from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/initials";

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    userService.getMe().then(setUser).catch((error) => console.log("No se pudo cargar el perfil", error));
    subscriptionService.getMySubscription()
      .then(setSubscription)
      .catch((error) => {
        if (error.status !== 404) console.log("No se pudo cargar la suscripción", error);
        setSubscription(null);
      });
  }, []);

  const hasActiveSubscription = hasSubscriptionAccess(subscription);

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <div className="profile-row align-items-center">
            {user?.profile_image_url ? (
              <img src={user.profile_image_url} alt={user.name} className="profile-photo" />
            ) : (
              <div className="profile-photo profile-photo-placeholder">{getInitials(user?.name)}</div>
            )}
            <div>
              <h1 className="profile-name">{user?.name}</h1>
              <p className="text-muted">@{user?.username}</p>
            </div>
          </div>

          <div className="content-section">
            <h3>Suscripción</h3>
            {hasActiveSubscription ? (
              <p>Plan {subscription.plan_display_name} — activa</p>
            ) : (
              <p>No tenés una suscripción activa.</p>
            )}
            <Link to="/planes" className="btn btn-light">
              {hasActiveSubscription ? "Cambiar de plan" : "Activar suscripción"}
            </Link>
          </div>

          <button type="button" className="btn btn-outline-danger" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
