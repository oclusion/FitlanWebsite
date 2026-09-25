import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import userService from "../services/userService";
import subscriptionService, {
  hasSubscriptionAccess,
  subscriptionStatusMeta,
  isManualSubscriptionError,
} from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState("");

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

  // Customer Portal de Stripe (cambiar método de pago, ver facturas, cancelar)
  // — solo tiene sentido con una suscripción activa (implica que ya existe un
  // stripe_customer_id, que es lo que requiere este endpoint).
  const handleOpenPortal = async () => {
    setPortalError("");
    setOpeningPortal(true);
    try {
      const { url } = await subscriptionService.openBillingPortal();
      window.location.assign(url);
    } catch (error) {
      console.log("No se pudo abrir el portal de suscripción", error);
      setPortalError(
        isManualSubscriptionError(error)
          ? "Tu plan fue activado manualmente por el equipo de Fitlán — contáctanos para hacer cambios."
          : error.error || "No se pudo abrir la gestión de suscripción. Intentá de nuevo en unos minutos.",
      );
      setOpeningPortal(false);
    }
  };

  return (
    // "coach-profile" es el scope compartido de los estilos del perfil (foto, nombre, banner)
    <div className="coach-profile">
      <Header />
      <main className="coach-main">

        {/* Banner (mismo que el perfil del coach) */}
        <section className="coach-hero" />

        <div className="container account-page">

          {/* Foto: se monta sobre el banner. Centrada en mobile, a la izquierda en md+ */}
          <div className="profile-photo-wrapper">
            {user?.profile_image_url ? (
              <img
                src={assetUrl(user.profile_image_url, user.profile_image_key)}
                alt={user.name}
                className="profile-photo"
              />
            ) : (
              <div className="profile-photo profile-photo-placeholder">{getInitials(user?.name)}</div>
            )}
          </div>

          <div className="row gx-lg-5 gy-4">

            {/* Columna principal: identidad y sesión */}
            <div className="col-lg-7">
              <div className="coach-identity text-center text-md-start">
                <h1 className="profile-name">{user?.name}</h1>
                <p className="text-muted mb-3">@{user?.username}</p>

                <div className="coach-actions-row d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                  <button type="button" className="btn btn-outline-danger" onClick={() => setShowLogoutConfirm(true)}>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>

            {/* Columna lateral: suscripción (y email si existe) */}
            <aside className="col-lg-4 offset-lg-1" aria-label="Datos de la cuenta">
              <section className="content-section coach-aside-group">
                <h4 className="coach-section-title" id="account-subscription-title">Suscripción</h4>
                {hasActiveSubscription ? (
                  <>
                    <p>Plan {subscription.plan_display_name}</p>
                    <p className={`plan-status plan-status--${subscriptionStatusMeta(subscription).modifier}`}>
                      {subscriptionStatusMeta(subscription).label}
                    </p>
                  </>
                ) : (
                  <p>No tienes una suscripción activa.</p>
                )}
                {portalError ? <div className="alert-box mb-3"><p>{portalError}</p></div> : null}
                <div className="account-subscription-actions">
                  {hasActiveSubscription ? (
                    // /planes muestra lo mismo (plan actual + este botón) con
                    // suscripción activa — para no duplicar el hop, la gestión
                    // vive directo acá, no "Cambiar de plan" → /planes.
                    <button type="button" className="btn btn-light" onClick={handleOpenPortal} disabled={openingPortal}>
                      {openingPortal ? "Abriendo..." : "Gestionar suscripción"}
                    </button>
                  ) : (
                    <Link to="/planes" className="btn btn-light">Activar suscripción</Link>
                  )}
                </div>
              </section>

              {user?.email ? (
                <section className="coach-aside-group">
                  <h5 className="coach-label">Email</h5>
                  <span className="coach-chip">{user.email}</span>
                </section>
              ) : null}
            </aside>
          </div>
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