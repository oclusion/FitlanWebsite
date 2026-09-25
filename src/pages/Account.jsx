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

// TODO: quitar cuando el backend mande user.trainings — datos de ejemplo
// solo para ver el diseño de la columna de "Entrenamientos". Ajusta los
// campos a la forma real que use TrainingCard (coach.trainings).
const PLACEHOLDER_TRAININGS = [
  { id: "placeholder-1", title: "Yoga para principiantes", level: "Básico" },
  { id: "placeholder-2", title: "Box: fundamentos", level: "Intermedio" },
  { id: "placeholder-3", title: "Vinyasa flow", level: "Intermedio" },
];

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    userService.getMe()
      .then((data) => setUser({ ...data, trainings: data.trainings ?? PLACEHOLDER_TRAININGS }))
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

  // TODO backend: user.bio = breve descripción del usuario (campo nuevo, opcional)
  // TODO backend: user.trainings = entrenamientos que el usuario ha tomado (mismo shape que coach.trainings)
  const trainings = user?.trainings ?? [];

  return (
    // "coach-profile" es el scope compartido de los estilos del perfil (foto, nombre, banner)
    <div className="coach-profile">
      <Header />
      <main className="coach-main">

        {/* Banner (mismo que el perfil del coach, sin frase) */}
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

            {/* Columna principal: identidad, descripción y suscripción */}
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

              {user?.bio ? (
                <>
                  <hr className="coach-divider" />
                  <section aria-labelledby="account-bio-title">
                    <h4 className="coach-section-title" id="account-bio-title">Sobre mí</h4>
                    <p className="profile-text">{user.bio}</p>
                  </section>
                </>
              ) : null}

              <hr className="coach-divider" />

              <section className="content-section" aria-labelledby="account-subscription-title">
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
            </div>

            {/* Columna lateral: entrenamientos que ha tomado (mismo patrón de chips que Idiomas) */}
            {trainings.length ? (
              <aside className="col-lg-4 offset-lg-1" aria-label="Entrenamientos del usuario">
                <section className="coach-aside-group">
                  <h5 className="coach-label">Diplomados o Certificaciones</h5>
                  <ul className="coach-chip-list">
                    {trainings.map((training) => (
                      <li key={training.id}>
                        <span className="coach-chip">{training.title}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            ) : null}
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