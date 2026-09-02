import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import userService from "../services/userService";
import subscriptionService, { hasSubscriptionAccess } from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <div className="container account-page">
          <div className="profile-row account-header">
            {user?.profile_image_url ? (
              <img
                src={assetUrl(user.profile_image_url, user.profile_image_key)}
                alt={user.name}
                className="account-avatar"
              />
            ) : (
              <div className="account-avatar profile-photo-placeholder">{getInitials(user?.name)}</div>
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
              <p>No tienes una suscripción activa.</p>
            )}
            <Link to="/planes" className="btn btn-light">
              {hasActiveSubscription ? "Cambiar de plan" : "Activar suscripción"}
            </Link>
          </div>

          <button type="button" className="btn btn-outline-danger" onClick={() => setShowLogoutConfirm(true)}>
            Cerrar sesión
          </button>
        </div>
      </main>
      <Footer />

      {showLogoutConfirm ? (
        <ConfirmModal
          title="Cerrar sesión"
          message="¿Seguro que deseas salir?"
          confirmLabel="Cerrar sesión"
          cancelLabel="Cancelar"
          onConfirm={logout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      ) : null}
    </div>
  );
};

export default Account;
