import { Link } from "react-router-dom";
import { formatDifficultyShort, formatDuration } from "../utils/format";
import { assetUrl } from "../utils/assetUrl";

// Card del feed (/entrenamientos). La imagen cubre todo el card; encima, sobre un
// degradado: título, dificultad, una línea divisoria y el nº de sesiones + los
// minutos totales (suma de la duración de todos los steps). `GET /training` ya
// trae `sessions[]` con sus `steps[]`.
const TrainingCard = ({ training }) => {
  const sessionCount = training.sessions?.length ?? 0;
  const totalSeconds = (training.sessions ?? []).reduce(
    (acc, s) => acc + (s.steps ?? []).reduce((sum, st) => sum + (st.duration_seconds ?? 0), 0),
    0,
  );

  return (
    <div className="col-6 col-md-4 col-lg-3 d-flex">
      <Link to={`/entrenamiento/${training.id}`} className="feed-card">
        {training.image_url ? (
          <img
            className="feed-card-img"
            src={assetUrl(training.image_url, training.image_key)}
            alt={training.title}
          />
        ) : (
          <div className="feed-card-img feed-card-img--placeholder" />
        )}
        <div className="feed-card-overlay">
          <h2 className="feed-card-title">{training.title}</h2>
          <span className="feed-card-difficulty">{formatDifficultyShort(training.difficulty_level)}</span>
          <hr className="feed-card-divider" />
          <span className="feed-card-meta">
            {sessionCount} {sessionCount === 1 ? "sesión" : "sesiones"}
            {totalSeconds ? ` · ${formatDuration(totalSeconds)}` : ""}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default TrainingCard;
