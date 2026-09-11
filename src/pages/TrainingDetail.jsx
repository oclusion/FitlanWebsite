import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { IoShareSocialOutline, IoTimeOutline, IoChevronForward } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import trainingService from "../services/trainingService";
import enrollmentService from "../services/enrollmentService";
import coachService from "../services/coachService";
import { formatDifficultyShort, firstName, formatDuration } from "../utils/format";
import ResponsiveImage from "../components/ResponsiveImage";
import TrainingHeroSkeleton from "../components/TrainingHeroSkeleton";
import SessionRowSkeleton from "../components/SessionRowSkeleton";

// Puerto de maquetas/assets/includes/training-detail.html. Los botones "Comenzar
// entrenamiento" y "Solicitar entrenamiento personalizado" de la maqueta se
// quitaron: el arranque del entrenamiento se hace desde la lista de "Sesiones" y
// no hay endpoint de entrenamiento personalizado en el backend. Las estrellas de
// rating tampoco existen en el modelo de datos, se omiten.
//
// Según la forma del entrenamiento, esta pantalla se salta a sí misma:
//   - 1 sesión con 1 step   -> directo al player de ese step
//   - 1 sesión con 2+ steps -> directo al listado de steps de esa sesión
//   - 2+ sesiones            -> se queda acá mostrando el listado de sesiones
// (`GET /training/{id}` ya trae `sessions[]` con sus `steps[]` embebidos.)
const TrainingDetail = () => {
  const { id } = useParams();
  const [training, setTraining] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    trainingService.getTrainingById(id)
      .then((data) => {
        setTraining(data);
        setIsFollowing(data.coach?.is_following ?? false);
      })
      .catch((error) => console.log("No se pudo cargar el entrenamiento", error));
    enrollmentService.enrollInTraining(id).catch((error) => console.log("No se pudo inscribir", error));
  }, [id]);

  const handleToggleFollow = async () => {
    if (!training?.coach?.id || followLoading) return;
    const next = !isFollowing;
    setFollowLoading(true);
    try {
      if (next) await coachService.followCoach(training.coach.id);
      else await coachService.unfollowCoach(training.coach.id);
      setIsFollowing(next);
    } catch (error) {
      console.log("No se pudo actualizar el seguimiento", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    // La URL pública (sin cuenta, sin videos), no la de la app — quien la
    // reciba no tiene sesión. Ver PublicTraining.jsx / server.js.
    const url = `${window.location.origin}/entrenamiento-publico/${training.id}`;
    if (navigator.share) {
      navigator.share({ title: training?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
  };

  if (!training) {
    return (
      <div>
        <Header />
        <main>
          <div className="container">
            <div className="row">
              <div className="col-12">
                <TrainingHeroSkeleton />
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <section className="training-meta">
                  <div className="training-instructor">
                    <span className="skeleton-line skeleton-line--instructor" />
                  </div>
                  <div className="training-actions">
                    <span className="skeleton-pill" />
                  </div>
                </section>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <section className="training-description">
                  <span className="skeleton-line skeleton-line--desc" />
                  <span className="skeleton-line skeleton-line--desc-short" />
                </section>
              </div>
            </div>

            <div className="row pt-b-50">
              <div className="col-12">
                <h3>Sesiones</h3>
                <div className="sessions-list">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SessionRowSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sessions = [...(training.sessions ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  if (sessions.length === 1) {
    const only = sessions[0];
    const orderedSteps = [...(only.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const base = `/entrenamiento/${training.id}/sesion/${only.id}`;
    if (orderedSteps.length === 1) {
      return <Navigate to={`${base}/step/${orderedSteps[0].id}`} replace />;
    }
    return <Navigate to={base} replace />;
  }

  // Una sesión de 1 solo step lleva directo al player; con 2+ steps, a su listado.
  const sessionTarget = (session) => {
    const base = `/entrenamiento/${training.id}/sesion/${session.id}`;
    const orderedSteps = [...(session.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return orderedSteps.length === 1 ? `${base}/step/${orderedSteps[0].id}` : base;
  };

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
                <button
                  className="share-button share-button--hero"
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartir"
                >
                  <IoShareSocialOutline />
                </button>
                <div className="training-hero-overlay">
                  <div className="training-hero-content">
                    <h1>{training.title}</h1>
                    <div className="training-badges">
                      <span className="training-badge">{formatDifficultyShort(training.difficulty_level)}</span>
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

          <div className="row">
            <div className="col-12">
              <section className="training-meta">
                {training.coach ? (
                  <div className="training-instructor">
                    <Link to={`/entrenador/${training.coach.id}`}>Entrena con {firstName(training.coach.name)}</Link>
                  </div>
                ) : null}
                {training.coach ? (
                  <div className="training-actions">
                    <button className="follow-button" type="button" onClick={handleToggleFollow} disabled={followLoading}>
                      {isFollowing ? "Siguiendo" : "Follow"}
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <section className="training-description">
                {training.description ? <p>{training.description}</p> : null}
              </section>
            </div>
          </div>

          <div className="row pt-b-50">
            <div className="col-12">
              <h3 className="sessions-heading">Sesiones{sessions.length > 0 ? ` (${sessions.length})` : ""}</h3>
              {sessions.length === 0 ? (
                <p className="sessions-empty">Este entrenamiento aún no tiene contenido disponible.</p>
              ) : (
                <div className="steps-cards-list">
                  {sessions.map((session) => (
                    <Link key={session.id} to={sessionTarget(session)} className="session-card">
                      {session.image_url || session.image_landscape_url ? (
                        <ResponsiveImage
                          className="session-card-image"
                          url={session.image_url}
                          imageKey={session.image_key}
                          landscapeUrl={session.image_landscape_url}
                          landscapeKey={session.image_landscape_key}
                          alt={session.title}
                        />
                      ) : (
                        <div className="session-card-image session-card-image--placeholder" />
                      )}
                      <div className="session-card-info">
                        <p className="session-card-title">{session.title}</p>
                        {session.description ? (
                          <p className="session-card-description">{session.description}</p>
                        ) : null}
                        <div className="session-card-meta">
                          <IoTimeOutline />
                          <span>
                            {formatDuration((session.steps ?? []).reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0))}
                          </span>
                          {session.steps?.length ? (
                            <span>· {session.steps.length} {session.steps.length === 1 ? "ejercicio" : "ejercicios"}</span>
                          ) : null}
                        </div>
                      </div>
                      <IoChevronForward className="session-card-chevron" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrainingDetail;
