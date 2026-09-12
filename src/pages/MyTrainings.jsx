import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoStatsChartOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import enrollmentService from "../services/enrollmentService";

// Equivalente web de ProgressScreen.jsx en la app móvil — mismo endpoint
// (GET /enrollments/me), mismo cálculo de % de avance. Homologado con esa
// pantalla: card sin borde (fondo colors.card), porcentaje en el accent,
// track del progreso sobre el fondo de la página (no el del card).
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
    <div>
      <Header />
      <main>
        <div className="container">
          <h1>Progreso</h1>

          {loading ? <p>Cargando...</p> : null}
          {!loading && enrollments.length === 0 ? (
            <div className="enrollment-empty">
              <IoStatsChartOutline />
              <p>Todavía no te inscribiste a ningún entrenamiento</p>
            </div>
          ) : null}

          <div className="enrollment-list">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="enrollment-card">
                <Link to={`/entrenamiento/${enrollment.training_id}`} className="enrollment-card-link">
                  <div className="enrollment-header">
                    <span className="enrollment-title">{enrollment.training_title}</span>
                    <span className="enrollment-percentage">{Math.round(enrollment.progress_percentage)}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, enrollment.progress_percentage))}%` }}
                    />
                  </div>
                  <p className="enrollment-sessions">
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
