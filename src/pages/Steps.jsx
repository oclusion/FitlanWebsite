import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoShareSocialOutline, IoTimeOutline, IoVideocamOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import sessionService from "../services/sessionService";
import trainingService from "../services/trainingService";
import coachService from "../services/coachService";
import { firstName, formatDuration } from "../utils/format";
import ResponsiveImage from "../components/ResponsiveImage";
import ExercisesList from "../components/ExercisesList";
import TrainingHeroSkeleton from "../components/TrainingHeroSkeleton";
import SessionRowSkeleton from "../components/SessionRowSkeleton";

// Puerto de maquetas/assets/includes/steps.html, homologado con
// SessionStepsScreen (rn-starter): hero con subtítulo (nº de ejercicios +
// duración total), "Entrena con {coach}" + seguir, descripción + ejercicios de
// la sesión (ExercisesList), y cada step listado como card con imagen, número,
// descripción truncada a una línea y meta (duración + "Video" si tiene). Al
// tocar un step se abre el player, que es una pantalla propia (ver
// StepPlayer). El registro de progreso lo hace StepPlayer al entrar a cada step.
const Steps = () => {
  const { trainingId, sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [training, setTraining] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    sessionService.getSessionById(sessionId)
      .then(setSession)
      .catch((error) => console.log("No se pudo cargar la sesión", error));
  }, [sessionId]);

  useEffect(() => {
    trainingService.getTrainingById(trainingId)
      .then((data) => {
        setTraining(data);
        setIsFollowing(data.coach?.is_following ?? false);
      })
      .catch((error) => console.log("No se pudo cargar el entrenamiento", error));
  }, [trainingId]);

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
    // La URL pública del training (sin cuenta, sin videos), no la de esta
    // sesión en la app — quien la reciba no tiene sesión. No hay página
    // pública de sesión, así que comparte la de su training.
    const url = `${window.location.origin}/entrenamiento-publico/${trainingId}`;
    if (navigator.share) {
      navigator.share({ title: session?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
  };

  if (!session) {
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
                <section className="training-description">
                  <span className="skeleton-line skeleton-line--desc" />
                  <span className="skeleton-line skeleton-line--desc-short" />
                </section>
              </div>
            </div>

            <div className="row pt-b-50">
              <div className="col-12">
                <div className="sessions-list">
                  {Array.from({ length: 4 }).map((_, i) => (
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

  const steps = [...(session.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const totalSeconds = steps.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0);

  const crumbs = [
    ...(training ? [{ label: training.title, to: `/entrenamiento/${trainingId}` }] : []),
    { label: session.title },
  ];

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <Breadcrumb items={crumbs} />
          <div className="row">
            <div className="col-12">
              <section className="training-hero">
                <ResponsiveImage
                  url={session.image_url}
                  imageKey={session.image_key}
                  landscapeUrl={session.image_landscape_url}
                  landscapeKey={session.image_landscape_key}
                  alt={session.title}
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
                    <h1>{session.title}</h1>
                    <p className="training-hero-subtitle">
                      {steps.length} {steps.length === 1 ? "ejercicio" : "ejercicios"} · {formatDuration(totalSeconds)}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {training?.coach ? (
            <div className="row">
              <div className="col-12">
                <section className="training-meta">
                  <div className="training-instructor">
                    <Link to={`/entrenador/${training.coach.id}`}>
                      Entrena con {firstName(training.coach.name)}
                    </Link>
                  </div>
                  <div className="training-actions">
                    <button
                      className="follow-button"
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                    >
                      {isFollowing ? "Siguiendo" : "Follow"}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          <div className="row">
            <div className="col-12">
              <section className="training-description">
                {session.description ? <p>{session.description}</p> : null}
                <ExercisesList exercises={session.exercises} />
              </section>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="steps-cards-list">
                {steps.map((step, index) => (
                  <Link
                    key={step.id}
                    to={`/entrenamiento/${trainingId}/sesion/${sessionId}/step/${step.id}`}
                    className="step-card"
                  >
                    {step.image_url || step.image_landscape_url ? (
                      <ResponsiveImage
                        className="step-card-image"
                        url={step.image_url}
                        imageKey={step.image_key}
                        landscapeUrl={step.image_landscape_url}
                        landscapeKey={step.image_landscape_key}
                        alt={step.title}
                      />
                    ) : (
                      <div className="step-card-image step-card-image--placeholder" />
                    )}
                    <div className="step-card-info">
                      <div className="step-card-title-row">
                        <span className="step-card-number">{index + 1}.</span>
                        <span className="step-card-title">{step.title}</span>
                      </div>
                      {step.description ? (
                        <p className="step-card-description">{step.description}</p>
                      ) : null}
                      <div className="step-card-meta">
                        <IoTimeOutline />
                        <span>{formatDuration(step.duration_seconds)}</span>
                        {step.video_url ? (
                          <>
                            <IoVideocamOutline className="step-card-video-icon" />
                            <span className="step-card-video-label">Video</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Steps;
