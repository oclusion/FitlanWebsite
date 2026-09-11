import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoPlay, IoShareSocialOutline, IoTimeOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import ShareMenu from "../components/ShareMenu";
import sessionService from "../services/sessionService";
import trainingService from "../services/trainingService";
import enrollmentService from "../services/enrollmentService";
import coachService from "../services/coachService";
import { firstName, formatDuration } from "../utils/format";
import { assetUrl } from "../utils/assetUrl";
import TrainingHeroSkeleton from "../components/TrainingHeroSkeleton";
import ExercisesList from "../components/ExercisesList";

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

// El player de un step usa el mismo layout que la pantalla de sesión (Steps):
// header del sitio, hero, "Entrena con {coach}" + seguir, descripción y
// duración. Donde la sesión lista sus steps, acá va el video. A diferencia de
// TrainingDetail/Steps, el título NO va superpuesto al hero — va debajo, en
// fila con la duración (StepPlayerScreen.titleRow en rn-starter), porque acá
// el hero es un video y superponer texto interfiere con los controles.
//
// El registro de progreso (enrollmentService.completeSession) se dispara con
// el evento `ended` del video — homologado con StepPlayerScreen (que escucha
// el evento nativo `playToEnd`) — no al entrar al step: si no, cualquier
// step quedaría "completado" con solo navegarlo, sin ver el video. Se manda
// la duración real del video (no la nominal del step). Steps sin video no
// se marcan por esta vía (igual que en la app).
const StepPlayer = () => {
  const { trainingId, sessionId, stepId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [session, setSession] = useState(null);
  const [training, setTraining] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
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
    setVideoEnded(false);
  }, [stepId]);

  const handleVideoEnded = () => {
    setVideoEnded(true);
    const watchedSeconds = Math.round(videoRef.current?.duration || activeStep.duration_seconds || 0);
    enrollmentService.completeSession(trainingId, sessionId, watchedSeconds)
      .catch((error) => console.log("No se pudo registrar la sesión completada", error));
  };

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

  // La URL pública del training (sin cuenta, sin videos), no la de este step
  // en la app — quien la reciba no tiene sesión. No hay página pública de
  // step, así que comparte la de su training. Se usa en los dos triggers de
  // compartir de abajo (hero y overlay de video terminado).
  const publicUrl = `${window.location.origin}/entrenamiento-publico/${trainingId}`;

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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!activeStep) {
    return (
      <div>
        <Header />
        <main className="pt-b-108"><div className="container"><p>Ejercicio no encontrado.</p></div></main>
        <Footer />
      </div>
    );
  }

  const description = training?.description ?? session.description;
  const durationSeconds = activeStep.duration_seconds ?? session.duration_seconds;

  const crumbs = [
    ...(training ? [{ label: training.title, to: `/entrenamiento/${trainingId}` }] : []),
    { label: session.title, to: `/entrenamiento/${trainingId}/sesion/${sessionId}` },
    { label: activeStep.title },
  ];

  return (
    <div>
      <Header />
      <main>
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
                    onEnded={handleVideoEnded}
                    controls={isPlaying}
                    playsInline
                  />
                ) : (
                  <div className="training-hero-video workout-video-placeholder">Video no disponible</div>
                )}

                <ShareMenu
                  url={publicUrl}
                  text={training?.title}
                  wrapperClassName="share-button share-button--hero"
                  ariaLabel="Compartir"
                />

                {!videoEnded && (isPlaying || currentTime > 0) ? (
                  <span className="training-hero-timer">{formatTimer(currentTime)}</span>
                ) : null}

                {!videoEnded && !isPlaying && activeStep.video_url ? (
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

                {/* Al terminar el video, se bloquea con este overlay — homologado
                    con el videoEndedOverlay de StepPlayerScreen — y solo se sale
                    por "Terminar" (o "Compartir" para compartir el logro). */}
                {videoEnded ? (
                  <div className="video-ended-overlay">
                    <IoCheckmarkCircleOutline className="video-ended-check" />
                    <div className="video-ended-actions">
                      <ShareMenu
                        url={publicUrl}
                        text={training?.title}
                        wrapperClassName="share-menu-wrapper--inline"
                        triggerClassName="video-ended-share"
                        ariaLabel="Compartir"
                      >
                        <IoShareSocialOutline />
                        Compartir
                      </ShareMenu>
                      <button
                        type="button"
                        className="video-ended-finish"
                        onClick={() => navigate(`/entrenamiento/${trainingId}/sesion/${sessionId}`)}
                      >
                        Terminar
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="step-title-row">
                <h2>{activeStep.title}</h2>
                <span className="step-duration">
                  <IoTimeOutline />
                  {formatDuration(durationSeconds)}
                </span>
              </div>
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
                <ExercisesList exercises={activeStep.exercises} />
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
