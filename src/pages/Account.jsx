import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoLocationOutline,
  IoCameraOutline,
  IoCloseOutline,
  IoLogoInstagram,
  IoLogoFacebook,
  IoLogoTiktok,
} from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import LocationSelect from "../components/LocationSelect";
import userService from "../services/userService";
import fileService from "../services/fileService";
import enrollmentService from "../services/enrollmentService";
import subscriptionService, {
  hasSubscriptionAccess,
  subscriptionStatusMeta,
  isManualSubscriptionError,
} from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import { toCompressedJpeg } from "../utils/imageCompress";

const Account = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
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
  const [certifications, setCertifications] = useState([]);
  const [addingCertification, setAddingCertification] = useState(false);
  const [certificationForm, setCertificationForm] = useState("");
  const [savingCertification, setSavingCertification] = useState(false);
  const [certificationError, setCertificationError] = useState("");
  const [deletingCertificationId, setDeletingCertificationId] = useState(null);
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialForm, setSocialForm] = useState({ instagram_url: "", facebook_url: "", tiktok_url: "" });
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialError, setSocialError] = useState("");

  useEffect(() => {
    userService.getMe()
      .then(setUser)
      .catch((error) => console.log("No se pudo cargar el perfil", error));
    subscriptionService.getMySubscription()
      .then(setSubscription)
      .catch((error) => {
        if (error.status !== 404) console.log("No se pudo cargar la suscripción", error);
        setSubscription(null);
      });
    enrollmentService.getMyEnrollments()
      .then(setEnrollments)
      .catch((error) => console.log("No se pudieron cargar los entrenamientos", error));
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

  // GET /enrollments/me — inscripciones reales del usuario, con link al entrenamiento.
  const trainings = enrollments.map((enrollment) => ({
    id: enrollment.training_id,
    title: enrollment.training_title,
  }));
  const location = [user?.city, user?.state, user?.country].filter(Boolean).join(", ");
  // motto (la "frase" del banner en CoachProfile.jsx) solo aplica a coaches.
  const isCoach = user?.roles?.includes("ROLE_COACH") ?? false;

  // GET /users/me/certifications requiere rol COACH — recién se sabe si el
  // usuario es coach después de cargar el perfil, así que va en su propio
  // efecto en vez del useEffect inicial.
  useEffect(() => {
    if (!isCoach) return;
    userService.getMyCertifications()
      .then(setCertifications)
      .catch((error) => console.log("No se pudieron cargar las certificaciones", error));
  }, [isCoach]);

  // country/state/city/profile_image_url/instagram_url/facebook_url/tiktok_url
  // son especiales en PUT /users/me: a diferencia del resto de los campos, "no
  // incluirlos" y "mandarlos null" es lo mismo para el backend — se borran
  // igual (ver README backend, nota en "Actualizar perfil propio"). Por eso
  // CUALQUIER guardado en esta pantalla (no solo el del campo que se está
  // editando) tiene que reenviar los valores actuales de TODOS estos campos,
  // o se pierden. profile_image_url va como profile_image_key: ese campo
  // acepta el key crudo al escribir, no la URL firmada que devuelve el GET.
  const currentProtectedFieldsPayload = () => ({
    country: user?.country ?? null,
    state: user?.state ?? null,
    city: user?.city ?? null,
    profile_image_url: user?.profile_image_key ?? null,
    instagram_url: user?.instagram_url ?? null,
    facebook_url: user?.facebook_url ?? null,
    tiktok_url: user?.tiktok_url ?? null,
  });

  // toCompressedJpeg() redimensiona/recodifica antes de subir — evita fotos
  // de varios MB directo de cámara. POST /files/upload devuelve { key, url }
  // — el key se reenvía en el campo profile_image_url al actualizar el
  // usuario (así lo documenta el backend: ese campo acepta el key crudo, no
  // una URL real).
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file) return;
    setPhotoError("");
    setUploadingPhoto(true);
    try {
      const compressed = await toCompressedJpeg(file);
      const { key } = await fileService.upload(compressed);
      const data = await userService.updateMe({ ...currentProtectedFieldsPayload(), profile_image_url: key });
      setUser((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.log("No se pudo actualizar la foto de perfil", error);
      setPhotoError(error.error || "No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStartEditName = () => {
    setNameForm(user?.name ?? "");
    setNameError("");
    setEditingName(true);
  };

  // A diferencia de description/motto/ubicación, el nombre no se puede dejar
  // vacío — no tiene sentido "borrarlo" con null.
  const handleSaveName = async () => {
    if (!nameForm.trim()) {
      setNameError("El nombre no puede estar vacío.");
      return;
    }
    setNameError("");
    setSavingName(true);
    try {
      const data = await userService.updateMe({ ...currentProtectedFieldsPayload(), name: nameForm.trim() });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingName(false);
    } catch (error) {
      console.log("No se pudo actualizar el nombre", error);
      setNameError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingName(false);
    }
  };

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
        ...currentProtectedFieldsPayload(),
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
      const data = await userService.updateMe({ ...currentProtectedFieldsPayload(), description: descriptionForm || null });
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
      const data = await userService.updateMe({ ...currentProtectedFieldsPayload(), motto: mottoForm || null });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingMotto(false);
    } catch (error) {
      console.log("No se pudo actualizar la frase", error);
      setMottoError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingMotto(false);
    }
  };

  const handleStartAddCertification = () => {
    setCertificationForm("");
    setCertificationError("");
    setAddingCertification(true);
  };

  // Máximo 200 caracteres — límite documentado en el backend (ver README).
  const handleAddCertification = async () => {
    const name = certificationForm.trim();
    if (!name) {
      setCertificationError("La certificación no puede estar vacía.");
      return;
    }
    setCertificationError("");
    setSavingCertification(true);
    try {
      const created = await userService.addCertification(name);
      setCertifications((prev) => [...prev, created]);
      setAddingCertification(false);
    } catch (error) {
      console.log("No se pudo agregar la certificación", error);
      setCertificationError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingCertification(false);
    }
  };

  const handleDeleteCertification = async (certId) => {
    setDeletingCertificationId(certId);
    try {
      await userService.deleteCertification(certId);
      setCertifications((prev) => prev.filter((cert) => cert.id !== certId));
    } catch (error) {
      console.log("No se pudo eliminar la certificación", error);
    } finally {
      setDeletingCertificationId(null);
    }
  };

  const hasSocial = user?.instagram_url || user?.facebook_url || user?.tiktok_url;

  const handleStartEditSocial = () => {
    setSocialForm({
      instagram_url: user?.instagram_url ?? "",
      facebook_url: user?.facebook_url ?? "",
      tiktok_url: user?.tiktok_url ?? "",
    });
    setSocialError("");
    setEditingSocial(true);
  };

  const handleSaveSocial = async () => {
    setSocialError("");
    setSavingSocial(true);
    try {
      const data = await userService.updateMe({
        ...currentProtectedFieldsPayload(),
        instagram_url: socialForm.instagram_url.trim() || null,
        facebook_url: socialForm.facebook_url.trim() || null,
        tiktok_url: socialForm.tiktok_url.trim() || null,
      });
      setUser((prev) => ({ ...prev, ...data }));
      setEditingSocial(false);
    } catch (error) {
      console.log("No se pudieron actualizar las redes sociales", error);
      setSocialError(error.error || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingSocial(false);
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
            <label
              className={`account-photo-edit${uploadingPhoto ? " account-photo-edit--loading" : ""}`}
              aria-label="Cambiar foto de perfil"
            >
              <IoCameraOutline aria-hidden="true" />
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} hidden />
            </label>
          </div>
          {photoError ? (
            <div className="alert-box account-photo-error mb-3 mx-auto"><p>{photoError}</p></div>
          ) : null}

          <div className="row gx-lg-5 gy-4">

            {/* Columna principal */}
            <div className="col-lg-7">
              <div className="coach-identity text-center text-md-start">
                {editingName ? (
                  <div className="account-description-edit mx-auto mx-md-0">
                    <input
                      type="text"
                      className="form-control"
                      value={nameForm}
                      onChange={(event) => setNameForm(event.target.value)}
                      placeholder="Tu nombre"
                    />
                    {nameError ? <div className="alert-box mb-3"><p>{nameError}</p></div> : null}
                    <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start mb-3">
                      <button type="button" className="btn btn-light" onClick={handleSaveName} disabled={savingName}>
                        {savingName ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setEditingName(false)}
                        disabled={savingName}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <h1 className="profile-name">
                    {user?.name}{" "}
                    <button type="button" className="account-edit-trigger" onClick={handleStartEditName}>
                      Editar
                    </button>
                  </h1>
                )}
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
                        <Link to={`/entrenamiento/${training.id}`} className="coach-chip">
                          {training.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Certificaciones — solo coaches (POST/DELETE /users/me/certifications
                  requiere ese rol); se muestran en CoachProfile.jsx bajo
                  "Diplomados o Certificaciones", ahí de solo lectura. */}
              {isCoach ? (
                <section className="coach-aside-group">
                  <h5 className="coach-label">Certificaciones</h5>
                  {certifications.length ? (
                    <ul className="coach-chip-list mb-3">
                      {certifications.map((cert) => (
                        <li key={cert.id}>
                          <span className="coach-chip coach-chip--removable">
                            {cert.name}
                            <button
                              type="button"
                              className="account-chip-remove"
                              aria-label={`Eliminar certificación ${cert.name}`}
                              onClick={() => handleDeleteCertification(cert.id)}
                              disabled={deletingCertificationId === cert.id}
                            >
                              <IoCloseOutline aria-hidden="true" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {addingCertification ? (
                    <div className="account-description-edit">
                      <input
                        type="text"
                        className="form-control"
                        value={certificationForm}
                        onChange={(event) => setCertificationForm(event.target.value)}
                        placeholder="Ej. ACE Personal Trainer"
                        maxLength={200}
                      />
                      {certificationError ? <div className="alert-box mb-3"><p>{certificationError}</p></div> : null}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={handleAddCertification}
                          disabled={savingCertification}
                        >
                          {savingCertification ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-light"
                          onClick={() => setAddingCertification(false)}
                          disabled={savingCertification}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="account-edit-trigger" onClick={handleStartAddCertification}>
                      + Agregar certificación
                    </button>
                  )}
                </section>
              ) : null}

              {/* Redes sociales — solo coaches; se muestran en CoachProfile.jsx
                  bajo "Sígueme en:", ahí de solo lectura. */}
              {isCoach ? (
                <section className="coach-aside-group profile-social">
                  <h5 className="coach-label">Redes sociales</h5>
                  {editingSocial ? (
                    <div className="account-description-edit">
                      <input
                        type="url"
                        className="form-control"
                        value={socialForm.instagram_url}
                        onChange={(event) => setSocialForm((prev) => ({ ...prev, instagram_url: event.target.value }))}
                        placeholder="URL de Instagram"
                      />
                      <input
                        type="url"
                        className="form-control"
                        value={socialForm.facebook_url}
                        onChange={(event) => setSocialForm((prev) => ({ ...prev, facebook_url: event.target.value }))}
                        placeholder="URL de Facebook"
                      />
                      <input
                        type="url"
                        className="form-control"
                        value={socialForm.tiktok_url}
                        onChange={(event) => setSocialForm((prev) => ({ ...prev, tiktok_url: event.target.value }))}
                        placeholder="URL de TikTok"
                      />
                      {socialError ? <div className="alert-box mb-3"><p>{socialError}</p></div> : null}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <button type="button" className="btn btn-light" onClick={handleSaveSocial} disabled={savingSocial}>
                          {savingSocial ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-light"
                          onClick={() => setEditingSocial(false)}
                          disabled={savingSocial}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {hasSocial ? (
                        <div className="d-flex gap-2 mb-2">
                          {user?.instagram_url ? (
                            <a href={user.instagram_url} className="social-icon" target="_blank" rel="noreferrer">
                              <IoLogoInstagram />
                            </a>
                          ) : null}
                          {user?.facebook_url ? (
                            <a href={user.facebook_url} className="social-icon" target="_blank" rel="noreferrer">
                              <IoLogoFacebook />
                            </a>
                          ) : null}
                          {user?.tiktok_url ? (
                            <a href={user.tiktok_url} className="social-icon" target="_blank" rel="noreferrer">
                              <IoLogoTiktok />
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mb-2">Sin redes sociales</p>
                      )}
                      <button type="button" className="account-edit-trigger" onClick={handleStartEditSocial}>
                        Editar
                      </button>
                    </>
                  )}
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