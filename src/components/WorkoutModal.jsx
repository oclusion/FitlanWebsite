import { useEffect, useRef, useState } from "react";
import { IoClose, IoPlay } from "react-icons/io5";
import { formatDuration } from "../utils/format";

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

// Puerto del modal de maquetas/assets/includes/steps.html — el timer del header y
// el botón de play propio son iguales a la maqueta; el HTML5 <video> nativo
// reemplaza al elemento <video> con play/pausa manual que ya traía.
const WorkoutModal = ({ steps, activeStepId, onClose, onSelectStep }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const activeStep = steps.find((step) => step.id === activeStepId);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeStepId]);

  if (!activeStep) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="workout-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="workout-header">
          <button type="button" className="workout-close" onClick={onClose} aria-label="Cerrar">
            <IoClose />
          </button>
          <span className="workout-timer">{formatTimer(currentTime)}</span>
        </div>

        <div className="workout-video-wrapper">
          {activeStep.video_url ? (
            <video
              ref={videoRef}
              className="workout-video"
              src={activeStep.video_url}
              onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={isPlaying}
              playsInline
            />
          ) : (
            <div className="workout-video-placeholder">Video no disponible</div>
          )}
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
        </div>

        <div className="workout-steps">
          <h2 className="workout-steps-title">{activeStep.title}</h2>
          {activeStep.description ? <p>{activeStep.description}</p> : null}
          {activeStep.exercises?.length ? (
            <ul className="workout-exercises">
              {activeStep.exercises.map((exercise, i) => <li key={i}>{exercise}</li>)}
            </ul>
          ) : null}

          <div className="row">
            <div className="col-12">
              <ul className="workout-steps-list">
                {steps.map((step) => (
                  <li key={step.id} className={step.id === activeStepId ? "step-highlight" : ""}>
                    <button type="button" className="step-modal" onClick={() => onSelectStep(step.id)}>
                      <span className="step-count">{formatDuration(step.duration_seconds)}</span>
                      <span className="step-desc">{step.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutModal;
