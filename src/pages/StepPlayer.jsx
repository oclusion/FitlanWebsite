import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoPlay, IoShareOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import sessionService from "../services/sessionService";
import trainingService from "../services/trainingService";
import enrollmentService from "../services/enrollmentService";
import coachService from "../services/coachService";
import { firstName, formatDuration } from "../utils/format";
import { assetUrl } from "../utils/assetUrl";

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

// El player de un step usa el mismo layout que la pantalla de sesión (Steps):
// header del sitio, hero con imagen + título, "Entrena con {coach}" + seguir,
// descripción y duración. Donde la sesión lista sus steps, acá va el video.
// El registro de progreso se hace al entrar a cada step.
const StepPlayer = () => {
  const { trainingId, sessionId, stepId } = useParams();
  const videoRef = useRef(null);
  const [session, setSession] = useState(null);
  const [training, setTraining] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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

  const steps = [...(session?.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const activeStep = steps.find((s) => String(s.id) === String(stepId));

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (activeStep) {
      enrollmentService.completeSession(trainingId, sessionId, activeStep.duration_seconds)
        .catch((error) => console.log("No se pudo registrar el progreso", error));
    }
  }, [stepId, activeStep, trainingId, sessionId]);

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

  if (!session) {
    return (
      <div className="light">
        <Header />
        <main className="pt-b-108"><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  if (!activeStep) {
    return (
      <div className="light">
        <Header />
        <main className="pt-b-108"><div className="container"><p>Ejercicio no encontrado.</p></div></main>
        <Footer />
      </div>
    );
  }

  const title = training?.title ?? session.title;
  const description = training?.description ?? session.description;
  const durationSeconds = activeStep.duration_seconds ?? session.duration_seconds;

  const crumbs = [
    ...(training ? [{ label: training.title, to: `/entrenamiento/${trainingId}` }] : []),
    { label: session.title, to: `/entrenamiento/${trainingId}/sesion/${sessionId}` },
    { label: activeStep.title },
  ];

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <Breadcrumb items={crumbs} />
          <div className="row">
            <div className="col-12">
              {/* El video ocupa el lugar de la imagen del hero */}
              <section className="training-hero">
                {activeStep.video_url ? (
                  <video
                    ref={videoRef}
                    className="training-hero-video"
                    src={assetUrl(activeStep.video_url, activeStep.video_key)}
                    onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls={isPlaying}
                    playsInline
                  />
                ) : (
                  <div className="training-hero-video workout-video-placeholder">Video no disponible</div>
                )}

                <button
                  className="share-button share-button--hero"
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartir"
                >
                  <IoShareOutline />
                </button>

                {isPlaying || currentTime > 0 ? (
                  <span className="training-hero-timer">{formatTimer(currentTime)}</span>
                ) : null}

                {!isPlaying && activeStep.video_url ? (
                  <button
                    type="button"
                    className="workout-play-btn"
                    onClick={() => {
                      videoRef.current?.play();
                      setIsPlaying(true);
                    }}
                    aria-label="Reproducir"
                  >
                    <IoPlay />
                  </button>
                ) : null}

                {!isPlaying ? (
                  <div className="training-hero-overlay">
                    <div className="training-hero-content">
                      <h1>{title}</h1>
                    </div>
                  </div>
                ) : null}
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
                {description ? <p>{description}</p> : null}
                <p className="training-recommendation">{formatDuration(durationSeconds)}</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StepPlayer;
