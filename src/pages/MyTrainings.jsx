import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import enrollmentService from "../services/enrollmentService";

// Equivalente web de ProgressScreen.jsx en la app móvil — mismo endpoint
// (GET /enrollments/me), mismo cálculo de % de avance.
const MyTrainings = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getMyEnrollments()
      .then(setEnrollments)
      .catch((error) => console.log("No se pudieron cargar las inscripciones", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <h1>Mis entrenamientos</h1>

          {loading ? <p>Cargando...</p> : null}
          {!loading && enrollments.length === 0 ? <p>Todavía no te inscribiste a ningún entrenamiento.</p> : null}

          <div className="enrollment-list">
            {enrollments.map((enrollment) => (
              <Link key={enrollment.id} to={`/entrenamiento/${enrollment.training_id}`} className="enrollment-card">
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
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTrainings;
