import { Link } from "react-router-dom";
import { formatDifficulty, firstName } from "../utils/format";

// Puerto de la card de maquetas/assets/includes/feed-training.html. La maqueta
// tenía estrellas de rating hardcodeadas — no existe ese campo en el backend
// todavía, así que se omite en vez de inventar datos falsos.
const TrainingCard = ({ training }) => (
  <div className="col-12 col-sm-6 col-lg-3">
    <article className="training-card">
      <Link to={`/entrenamiento/${training.id}`}>
        {training.image_url ? (
          <img src={training.image_url} alt={training.title} />
        ) : (
          <div className="training-card-placeholder" />
        )}
      </Link>
      <div className="training-card-content">
        {training.description ? <p>{training.description}</p> : null}
        <h2><Link to={`/entrenamiento/${training.id}`}>{training.title}</Link></h2>
        <span>{formatDifficulty(training.difficulty_level)}</span>
        {training.coach ? (
          <Link to={`/entrenador/${training.coach.id}`} className="btn btn-light">
            Entrena con {firstName(training.coach.name)}
          </Link>
        ) : null}
      </div>
    </article>
  </div>
);

export default TrainingCard;
