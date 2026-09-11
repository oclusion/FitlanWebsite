import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import trainingService from "../services/trainingService";
import { formatDifficultyShort, formatDuration } from "../utils/format";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import ResponsiveImage from "../components/ResponsiveImage";
import TrainingHeroSkeleton from "../components/TrainingHeroSkeleton";

// Página pública para compartir un training (sin cuenta, sin videos) — ver
// documentacion-backend/PROPUESTA-training-publico.md. El servidor de
// producción (server.js) le arma meta tags og:*/twitter:* específicos del
// training a los bots de vista previa de redes que pidan esta misma ruta;
// esta página es lo que ve un visitante humano que sí ejecuta JavaScript.
// El objetivo es conversión: mostrar de qué se trata y mandarlo a /registro.
const PublicTraining = () => {
  const { id } = useParams();
  const [training, setTraining] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainingService.getPublicTraining(id)
      .then(setTraining)
      .catch((error) => {
        console.log("No se pudo cargar el entrenamiento público", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Header />
        <main>
          <div className="container">
            <TrainingHeroSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !training) {
    return (
      <div>
        <Header />
        <main>
          <div className="container text-center pt-b-50">
            <h1>Entrenamiento no disponible</h1>
            <p>Este entrenamiento no existe o ya no está disponible.</p>
            <Link to="/" className="btn btn-primary btn-sesion">Ir al inicio</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sessions = [...(training.sessions ?? [])];

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <section className="training-hero">
                <ResponsiveImage
                  url={training.image_url}
                  imageKey={training.image_key}
                  landscapeUrl={training.image_landscape_url}
                  landscapeKey={training.image_landscape_key}
                  alt={training.title}
                  className="training-hero-image"
                />
                <div className="training-hero-overlay">
                  <div className="training-hero-content">
                    <h1>{training.title}</h1>
                    <div className="training-badges">
                      {training.difficulty_level ? (
                        <span className="training-badge">{formatDifficultyShort(training.difficulty_level)}</span>
                      ) : null}
                      {training.premium ? <span className="training-badge training-badge--premium">PREMIUM</span> : null}
                      {training.categories?.map((cat) => (
                        <span key={cat.id} className="training-badge">{cat.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {training.coach ? (
            <div className="row">
              <div className="col-12">
                <div className="public-training-coach">
                  {training.coach.profile_image_url ? (
                    <img
                      className="public-training-coach-avatar"
                      src={assetUrl(training.coach.profile_image_url, training.coach.profile_image_key)}
                      alt={training.coach.name}
                    />
                  ) : (
                    <span className="public-training-coach-avatar public-training-coach-avatar--placeholder">
                      {getInitials(training.coach.name)}
                    </span>
                  )}
                  <span>Con {training.coach.name}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="row">
            <div className="col-12">
              <section className="training-description">
                {training.description ? <p>{training.description}</p> : null}
              </section>
            </div>
          </div>

          {sessions.length > 0 ? (
            <div className="row pt-b-50">
              <div className="col-12">
                <h3 className="sessions-heading">Sesiones ({sessions.length})</h3>
                <div className="steps-cards-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-card public-training-session-row">
                      <div className="session-card-info">
                        <p className="session-card-title">{session.title}</p>
                        <div className="session-card-meta">
                          <span>{formatDuration(session.duration_seconds)}</span>
                          {session.steps?.length ? (
                            <span>· {session.steps.length} {session.steps.length === 1 ? "ejercicio" : "ejercicios"}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="row pt-b-50">
            <div className="col-12 col-md-6 mx-auto text-center">
              <h3>¿Quieres empezar este entrenamiento?</h3>
              <p>Regístrate gratis y accede a este y todos los entrenamientos de Fitlán Academy.</p>
              <Link to="/registro" className="btn btn-primary btn-sesion">Quiero empezar este entrenamiento</Link>
              <p className="auth-switch">
                ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicTraining;
