import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoShareSocialOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import enrollmentService from "../services/enrollmentService";

// Equivalente web de ProgressScreen.jsx en la app móvil — mismo endpoint
// (GET /enrollments/me), mismo cálculo de % de avance. El botón de compartir
// por card no existe en la app (ver ProgressScreen.jsx) — es propio del sitio,
// mismo criterio que TrainingDetail/Steps/StepPlayer: comparte la URL pública
// (/entrenamiento-publico/:id, sin cuenta, sin videos), no la de la app.
const MyTrainings = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getMyEnrollments()
      .then(setEnrollments)
      .catch((error) => console.log("No se pudieron cargar las inscripciones", error))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = (enrollment) => {
    const url = `${window.location.origin}/entrenamiento-publico/${enrollment.training_id}`;
    const text = `¡Llevo ${Math.round(enrollment.progress_percentage)}% de "${enrollment.training_title}" en Fitlán Academy! 💪`;
    if (navigator.share) {
      navigator.share({ title: enrollment.training_title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <h1>Mis entrenamientos</h1>

          {loading ? <p>Cargando...</p> : null}
          {!loading && enrollments.length === 0 ? <p>Todavía no te inscribiste a ningún entrenamiento.</p> : null}

          <div className="enrollment-list">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="enrollment-card">
                <button
                  type="button"
                  className="enrollment-card-share"
                  onClick={() => handleShare(enrollment)}
                  aria-label={`Compartir ${enrollment.training_title}`}
                >
                  <IoShareSocialOutline />
                </button>
                <Link to={`/entrenamiento/${enrollment.training_id}`} className="enrollment-card-link">
                  <div className="enrollment-header">
                    <span>{enrollment.training_title}</span>
                    <span>{Math.round(enrollment.progress_percentage)}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, enrollment.progress_percentage))}%` }}
                    />
                  </div>
                  <p className="text-muted">
                    {enrollment.sessions_completed} de {enrollment.sessions_total}{" "}
                    {enrollment.sessions_total === 1 ? "sesión completada" : "sesiones completadas"}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTrainings;
