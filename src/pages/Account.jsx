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

// TODO: quitar cuando el backend mande estos campos
const PLACEHOLDERS = {
  bio: "Breve descripción del usuario",
  trainings: [
    { id: "placeholder-1", title: "Yoga para principiantes" },
    { id: "placeholder-2", title: "Box: fundamentos" },
    { id: "placeholder-3", title: "Vinyasa flow" },
  ],
};

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    userService.getMe()
      .then((data) => setUser({ ...(import.meta.env.DEV ? PLACEHOLDERS : {}), ...data })) // TODO: quitar cuando el backend mande estos campos
      .catch((error) => console.log("No se pudo cargar el perfil", error));
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

  // TODO backend: user.bio = breve descripción del usuario
  // TODO backend: user.trainings = entrenamientos que el usuario ha tomado (mismo shape que coach.trainings)
  const trainings = user?.trainings ?? [];

  return (
    // "coach-profile" es el scope compartido de los estilos del perfil (foto, nombre, banner)
    <div className="coach-profile">
      <Header />
      <main className="coach-main">

        {/* Banner (mismo que el perfil del coach; sin frase, la cuenta no tiene "quote") */}
        <section className="coach-hero" />

        <div className="container">

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

            {/* Columna principal */}
            <div className="col-lg-7">
              <div className="coach-identity text-center text-md-start">
                <h1 className="profile-name">{user?.name}</h1>
                <p className="text-muted mb-3">@{user?.username}</p>

                {/* Breve descripción del usuario, en el mismo lugar donde el
                    coach tiene ubicación y rol, antes de las acciones */}
                {user?.bio ? <p className="profile-text mx-auto mx-md-0">{user.bio}</p> : null}

                <hr className="coach-divider" />

                <div className="coach-actions-row d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                  <button type="button" className="btn btn-outline-danger" onClick={() => setShowLogoutConfirm(true)}>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>

            {/* Columna lateral */}
            <aside className="col-lg-4 offset-lg-1" aria-label="Datos de la cuenta">
              <section className="coach-aside-group" aria-labelledby="account-subscription-title">
                <h5 className="coach-label" id="account-subscription-title">Suscripción</h5>
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

              {trainings.length ? (
                <section className="coach-aside-group">
                  <h5 className="coach-label">Entrenamientos</h5>
                  <ul className="coach-chip-list">
                    {trainings.map((training) => (
                      <li key={training.id}>
                        <span className="coach-chip">{training.title}</span>
                      </li>
                    ))}
                  </ul>
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