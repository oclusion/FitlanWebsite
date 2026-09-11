import { Link } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import ResponsiveImage from "./ResponsiveImage";
import { formatDifficultyShort } from "../utils/format";

// "Recientes" del feed — homologado con recentSection de TrainingsScreen.jsx
// (rn-starter): riel horizontal con los últimos entrenamientos con actividad
// (GET /enrollments/me/recent, hasta 5; acá se muestran los primeros 4). Se
// pidió que las cards midan lo mismo que las de "Entrenamientos" — reutiliza
// las clases de TrainingCard (.feed-card/-img/-overlay/-title), solo con
// título + badge de dificultad, sin meta de sesiones/duración. Se oculta
// durante la búsqueda por texto — ver Feed.jsx.
const RecentTrainingsRail = ({ trainings }) => {
  if (trainings.length === 0) return null;

  return (
    <div className="recent-trainings">
      <h3 className="feed-section-title">Recientes</h3>
      <div className="scroll-hint-wrap">
        <div className="recent-trainings-scroll">
          {trainings.map((training) => (
            <Link key={training.id} to={`/entrenamiento/${training.id}`} className="feed-card recent-card">
              {training.image_url || training.image_landscape_url ? (
                <ResponsiveImage
                  className="feed-card-img"
                  url={training.image_url}
                  imageKey={training.image_key}
                  landscapeUrl={training.image_landscape_url}
                  landscapeKey={training.image_landscape_key}
                  alt={training.title}
                />
              ) : (
                <div className="feed-card-img feed-card-img--placeholder" />
              )}
              <div className="feed-card-overlay">
                <h2 className="feed-card-title">{training.title}</h2>
                <span className="feed-card-difficulty">{formatDifficultyShort(training.difficulty_level)}</span>
              </div>
            </Link>
          ))}
        </div>
        {/* Puramente decorativa — el degradado ya insinúa que sigue, esto lo
            hace más explícito. */}
        <span className="scroll-hint-arrow" aria-hidden="true">
          <IoChevronForward />
        </span>
      </div>
    </div>
  );
};

export default RecentTrainingsRail;
