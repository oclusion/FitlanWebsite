import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoLogoInstagram,
  IoLogoFacebook,
  IoLogoTiktok,
  IoChatbubbleEllipsesOutline,
  IoLocationOutline,
  IoArrowDown,
} from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import coachService from "../services/coachService";
import conversationService from "../services/conversationService";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import TrainingCard from "../components/TrainingCard";

// A partir de este largo, la descripción se recorta a 5 líneas con "Leer más".
const EXPERIENCE_CLAMP_CHARS = 280;

// TODO: quitar cuando el backend mande estos campos
const PLACEHOLDERS = {
  quote: "Frase del instructor",
  location: "Ciudad, País",
  role: "Instructor de Yoga",
  languages: [
    { name: "Español", level: "Nativo" },
    { name: "Inglés", level: "Intermedio alto" },
  ],
  disciplines: ["Yoga", "Vinyasa", "Movilidad"],
  email: "instructor@fitlan.fit",
  phone: "00 0000 0000",
};


// Puerto de maquetas/assets/includes/profile.html (era en realidad el perfil de
// un coach, no del usuario propio — mismo dato de prueba, Keftiu Barrón).
const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [experienceOpen, setExperienceOpen] = useState(false);

  useEffect(() => {
    coachService.getCoach(id)
      .then((data) => {
        setCoach({ ...(import.meta.env.DEV ? PLACEHOLDERS : {}), ...data }); // TODO: quitar cuando el backend mande estos campos
        setIsFollowing(data.is_following ?? false);
      })
      .catch((error) => console.log("No se pudo cargar el coach", error));
  }, [id]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    const next = !isFollowing;
    setFollowLoading(true);
    try {
      if (next) await coachService.followCoach(id);
      else await coachService.unfollowCoach(id);
      setIsFollowing(next);
    } catch (error) {
      console.log("No se pudo actualizar el seguimiento", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (startingChat) return;
    setStartingChat(true);
    setChatError(null);
    try {
      const conversation = await conversationService.startConversation(id);
      navigate(`/mensajes/${conversation.id}`);
    } catch (error) {
      setChatError(error.message || "No se pudo iniciar la conversación");
    } finally {
      setStartingChat(false);
    }
  };

  if (!coach) {
    return (
      <div>
        <Header />
        <main><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  const hasSocial = coach.instagram_url || coach.facebook_url || coach.tiktok_url;

  // Campos nuevos (todos opcionales; si no vienen del backend, el bloque no se pinta)
  const languages = coach.languages ?? [];     // [{ name, level }]
  const disciplines = coach.disciplines ?? []; // ["Yoga", "Vinyasa", ...]
  const brands = coach.brands ?? [];           // [{ name, logo_url, logo_key }]
  const hasAside = languages.length || disciplines.length || coach.email || coach.phone || hasSocial;
  const isLongExperience = (coach.description?.length ?? 0) > EXPERIENCE_CLAMP_CHARS;

  return (
    <div className="coach-profile">
      <Header />
      <main className="coach-main">

        {/* Banner con frase (centrado en mobile y desktop) */}
        <section className="coach-hero">
        <figure className="coach-hero-quote">
          {/* TODO backend: coach.quote = frase del instructor, coach.quote_author = firma (opcional) */}
          <blockquote className="coach-hero-text">
            “{coach.quote || "Aquí va la frase del instructor"}”
          </blockquote>
          <figcaption className="coach-hero-author">— {coach.quote_author || coach.name}</figcaption>
        </figure>
      </section>

        <div className="container">

          {/* Foto de perfil: se monta sobre el banner. Centrada en mobile, a la izquierda en md+ */}
          <div className="profile-photo-wrapper">
            {coach.profile_image_url ? (
              <img
                src={assetUrl(coach.profile_image_url, coach.profile_image_key)}
                alt={coach.name}
                className="profile-photo"
              />
            ) : (
              <div className="profile-photo profile-photo-placeholder">{getInitials(coach.name)}</div>
            )}
          </div>

          <div className="row gx-lg-5 gy-4">

            {/* Columna principal */}
            <div className="col-lg-7">
              <div className="coach-identity text-center text-md-start">
                <h1 className="profile-name">{coach.name}</h1>
                {coach.location ? (
                  <p className="coach-location">
                    <IoLocationOutline aria-hidden="true" /> {coach.location}
                  </p>
                ) : null}
                {coach.role ? <p className="coach-role">{coach.role}</p> : null}

                <div className="coach-actions-row d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                  <button className="follow-button" type="button" onClick={handleToggleFollow} disabled={followLoading}>
                    {isFollowing ? "Siguiendo" : "Follow"}
                  </button>
                  <button className="follow-button chat-button" type="button" onClick={handleOpenChat} disabled={startingChat}>
                    <IoChatbubbleEllipsesOutline />
                    Chatear
                  </button>
                </div>
                {chatError ? <div className="alert-box"><p>{chatError}</p></div> : null}
              </div>

              {coach.description ? (
                <>
                  <hr className="coach-divider" />
                  <section aria-labelledby="coach-experience-title">
                    <h4 className="coach-section-title" id="coach-experience-title">Experiencia</h4>
                    <p
                      id="coach-experience"
                      className={`profile-text coach-experience-text${experienceOpen ? " is-expanded" : ""}`}
                    >
                      {coach.description}
                    </p>
                    {isLongExperience ? (
                      <button
                        type="button"
                        className="coach-readmore"
                        aria-expanded={experienceOpen}
                        aria-controls="coach-experience"
                        onClick={() => setExperienceOpen((open) => !open)}
                      >
                        {experienceOpen ? "Leer menos" : "Leer más"}
                        <IoArrowDown aria-hidden="true" />
                      </button>
                    ) : null}
                  </section>
                </>
              ) : null}
            </div>

            {/* Columna lateral */}
            {hasAside ? (
              <aside className="col-lg-4 offset-lg-1" aria-label="Datos del instructor">
                {languages.length ? (
                  <section className="coach-aside-group">
                    <h5 className="coach-label">Diplomados o Certificaciones</h5>
                    <ul className="coach-chip-list">
                      {languages.map((lang) => (
                        <li key={lang.name}>
                          <span className="coach-chip">
                            {lang.name}
                            {lang.level ? <>: <span className="coach-chip-meta">{lang.level}</span></> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {disciplines.length ? (
                  <section className="coach-aside-group">
                    <h5 className="coach-label">Disciplinas destacadas</h5>
                    <ul className="coach-chip-list">
                      {disciplines.map((discipline) => (
                        <li key={discipline}><span className="coach-chip">{discipline}</span></li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {coach.email ? (
                  <section className="coach-aside-group">
                    <h5 className="coach-label">Email</h5>
                    <a className="coach-chip" href={`mailto:${coach.email}`}>{coach.email}</a>
                  </section>
                ) : null}

                {coach.phone ? (
                  <section className="coach-aside-group">
                    <h5 className="coach-label">Teléfono</h5>
                    <a className="coach-chip" href={`tel:${coach.phone.replace(/\s+/g, "")}`}>{coach.phone}</a>
                  </section>
                ) : null}

                {hasSocial ? (
                  <section className="coach-aside-group profile-social">
                    <h5 className="coach-label">Sígueme en:</h5>
                    <div className="d-flex gap-2">
                      {coach.instagram_url ? (
                        <a href={coach.instagram_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoInstagram /></a>
                      ) : null}
                      {coach.facebook_url ? (
                        <a href={coach.facebook_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoFacebook /></a>
                      ) : null}
                      {coach.tiktok_url ? (
                        <a href={coach.tiktok_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoTiktok /></a>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </aside>
            ) : null}
          </div>

          {/* Marcas / gimnasios con los que ha trabajado */}
          {brands.length ? (
            <section className="pt-b-50" aria-labelledby="coach-brands-title">
              <h4 className="coach-brands-title" id="coach-brands-title">Marcas y gimnasios con los que he trabajado</h4>
              <ul className="coach-brand-logos">
                {brands.map((brand) => (
                  <li key={brand.name}>
                    <img src={assetUrl(brand.logo_url, brand.logo_key)} alt={brand.name} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {coach.trainings?.length ? (
            <div className="row pt-b-50">
              <div className="col-12">
                <h3>Entrenamientos</h3>
                <div className="row g-3">
                  {coach.trainings.map((training) => (
                    <TrainingCard key={training.id} training={training} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachProfile;