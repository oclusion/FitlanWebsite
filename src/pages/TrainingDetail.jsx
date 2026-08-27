import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoShareOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import trainingService from "../services/trainingService";
import enrollmentService from "../services/enrollmentService";
import coachService from "../services/coachService";
import { formatDifficulty, firstName, formatDuration } from "../utils/format";

// Puerto de maquetas/assets/includes/training-detail.html. Los botones "Comenzar
// entrenamiento" y "Solicitar entrenamiento personalizado" de la maqueta se
// quitaron: el arranque del entrenamiento se hace desde la lista de "Sesiones" y
// no hay endpoint de entrenamiento personalizado en el backend. Las estrellas de
// rating tampoco existen en el modelo de datos, se omiten.
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
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: training?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
  };

  if (!training) {
    return (
      <div className="light">
        <Header />
        <main className="pt-b-108"><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  const sessions = [...(training.sessions ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <section className="training-hero">
                {training.image_url ? (
                  <img src={training.image_url} alt={training.title} className="training-hero-image" />
                ) : null}
                <button
                  className="share-button share-button--hero"
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartir"
                >
                  <IoShareOutline />
                </button>
                <div className="training-hero-overlay">
                  <div className="training-hero-content">
                    {training.description ? <p className="training-eyebrow">{training.description}</p> : null}
                    <h1>{training.title}</h1>
                    <p className="training-level">{formatDifficulty(training.difficulty_level)}</p>
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

          {sessions.length > 0 ? (
            <div className="row pt-b-50">
              <div className="col-12">
                <h3>Sesiones</h3>
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/entrenamiento/${training.id}/sesion/${session.id}`}
                      className="session-row"
                    >
                      <span>{session.title}</span>
                      <span className="session-meta">
                        {formatDuration(session.duration_seconds)}
                        {session.steps?.length ? ` · ${session.steps.length} ejercicios` : ""}
                      </span>
                    </Link>
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

export default TrainingDetail;
