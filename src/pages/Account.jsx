import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoLocationOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import LocationSelect from "../components/LocationSelect";
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
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ country: "", state: "", city: "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionForm, setDescriptionForm] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [editingMotto, setEditingMotto] = useState(false);
  const [mottoForm, setMottoForm] = useState("");
  const [savingMotto, setSavingMotto] = useState(false);
  const [mottoError, setMottoError] = useState("");

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

  // TODO backend: user.trainings = entrenamientos que el usuario ha tomado (mismo shape que coach.trainings)
  const trainings = user?.trainings ?? [];
  const location = [user?.city, user?.state, user?.country].filter(Boolean).join(", ");
  // motto (la "frase" del banner en CoachProfile.jsx) solo aplica a coaches.
  const isCoach = user?.roles?.includes("ROLE_COACH") ?? false;

  const handleStartEditLocation = () => {
    setLocationForm({ country: user?.country ?? "", state: user?.state ?? "", city: user?.city ?? "" });
    setLocationError("");
    setEditingLocation(true);
  };

  // country/state/city siempre se sobreescriben con lo que se mande (ver
  // README backend) — si el usuario los deja vacíos en el form, se manda
  // null explícito para borrarlos, no se omiten.
  const handleSaveLocation = async () => {
    setLocationError("");
    setSavingLocation(true);
    try {
      const data = await userService.updateMe({
        country: locationForm.country || null,
        state: locationForm.state || null,
        city: locationForm.city || null,
      });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingLocation(false);
    } catch (error) {
      console.log("No se pudo actualizar la ubicación", error);
      setLocationError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleStartEditDescription = () => {
    setDescriptionForm(user?.description ?? "");
    setDescriptionError("");
    setEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    setDescriptionError("");
    setSavingDescription(true);
    try {
      const data = await userService.updateMe({ description: descriptionForm || null });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingDescription(false);
    } catch (error) {
      console.log("No se pudo actualizar la descripción", error);
      setDescriptionError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingDescription(false);
    }
  };

  const handleStartEditMotto = () => {
    setMottoForm(user?.motto ?? "");
    setMottoError("");
    setEditingMotto(true);
  };

  // Máximo 160 caracteres — límite documentado en el backend (ver README).
  const handleSaveMotto = async () => {
    setMottoError("");
    setSavingMotto(true);
    try {
      const data = await userService.updateMe({ motto: mottoForm || null });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingMotto(false);
    } catch (error) {
      console.log("No se pudo actualizar la frase", error);
      setMottoError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingMotto(false);
    }
  };

  return (
    // "coach-profile" es el scope compartido de los estilos del perfil (foto, nombre, banner)
    <div className="coach-profile">
      <Header />
      <main className="coach-main">

        {/* Banner (mismo que el perfil del coach; sin frase, la cuenta no tiene "quote") */}
        <section className="user-hero" />

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

                {editingLocation ? (
                  <div className="account-location-edit">
                    <LocationSelect
                      value={locationForm}
                      onChange={setLocationForm}
                      idPrefix="account-location"
                    />
                    {locationError ? <div className="alert-box mb-3"><p>{locationError}</p></div> : null}
                    <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start mb-3">
                      <button type="button" className="btn btn-light" onClick={handleSaveLocation} disabled={savingLocation}>
                        {savingLocation ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setEditingLocation(false)}
                        disabled={savingLocation}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="coach-location">
                    <IoLocationOutline aria-hidden="true" /> {location || "Sin ubicación"}{" "}
                    <button type="button" className="account-edit-trigger" onClick={handleStartEditLocation}>
                      Editar
                    </button>
                  </p>
                )}

                {/* motto — la "frase" del banner de CoachProfile.jsx — solo
                    aplica a usuarios con ROLE_COACH, se edita acá porque
                    CoachProfile.jsx es de solo lectura (perfil de otros). */}
                {isCoach ? (
                  editingMotto ? (
                    <div className="account-description-edit mx-auto mx-md-0">
                      <input
                        type="text"
                        className="form-control"
                        value={mottoForm}
                        onChange={(event) => setMottoForm(event.target.value)}
                        placeholder="Tu frase como entrenador"
                        maxLength={160}
                      />
                      {mottoError ? <div className="alert-box mb-3"><p>{mottoError}</p></div> : null}
                      <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start mb-3">
                        <button type="button" className="btn btn-light" onClick={handleSaveMotto} disabled={savingMotto}>
                          {savingMotto ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-light"
                          onClick={() => setEditingMotto(false)}
                          disabled={savingMotto}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="profile-text mx-auto mx-md-0">
                      {user?.motto ? `“${user.motto}”` : "Sin frase"}{" "}
                      <button type="button" className="account-edit-trigger" onClick={handleStartEditMotto}>
                        Editar
                      </button>
                    </p>
                  )
                ) : null}

                {/* description es un campo real (mismo que usa CoachProfile para
                    "Experiencia"), no un placeholder — en el mismo lugar donde
                    el coach tiene ubicación y rol, antes de las acciones */}
                {editingDescription ? (
                  <div className="account-description-edit mx-auto mx-md-0">
                    <textarea
                      className="form-control"
                      value={descriptionForm}
                      onChange={(event) => setDescriptionForm(event.target.value)}
                      placeholder="Escribí una breve descripción"
                      rows={3}
                    />
                    {descriptionError ? <div className="alert-box mb-3"><p>{descriptionError}</p></div> : null}
                    <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start mb-3">
                      <button type="button" className="btn btn-light" onClick={handleSaveDescription} disabled={savingDescription}>
                        {savingDescription ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setEditingDescription(false)}
                        disabled={savingDescription}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="profile-text mx-auto mx-md-0">
                    {user?.description || "Sin descripción"}{" "}
                    <button type="button" className="account-edit-trigger" onClick={handleStartEditDescription}>
                      Editar
                    </button>
                  </p>
                )}

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
                    <p>{subscription.plan_display_name}</p>
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