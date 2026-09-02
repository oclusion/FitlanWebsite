import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import sessionService from "../services/sessionService";
import trainingService from "../services/trainingService";
import { formatDuration } from "../utils/format";
import { assetUrl } from "../utils/assetUrl";

// Puerto de maquetas/assets/includes/steps.html. El listado de steps se muestra
// con el mismo estilo que el listado de sesiones (.sessions-list); al tocar uno
// se abre el player, que es una pantalla propia (ver StepPlayer). El registro de
// progreso lo hace StepPlayer al entrar a cada step.
const Steps = () => {
  const { trainingId, sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [training, setTraining] = useState(null);

  useEffect(() => {
    sessionService.getSessionById(sessionId)
      .then(setSession)
      .catch((error) => console.log("No se pudo cargar la sesión", error));
  }, [sessionId]);

  useEffect(() => {
    trainingService.getTrainingById(trainingId)
      .then(setTraining)
      .catch((error) => console.log("No se pudo cargar el entrenamiento", error));
  }, [trainingId]);

  if (!session) {
    return (
      <div>
        <Header />
        <main className="pt-b-108"><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  const steps = [...(session.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

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
                {session.image_url ? (
                  <img
                    src={assetUrl(session.image_url, session.image_key)}
                    alt={session.title}
                    className="training-hero-image"
                  />
                ) : null}
                <div className="training-hero-overlay">
                  <div className="training-hero-content">
                    <h1>{session.title}</h1>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <section className="training-description">
                {session.description ? <p>{session.description}</p> : null}
                <p className="training-recommendation">
                  {formatDuration(steps.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0))} en total ·{" "}
                  {steps.length} {steps.length === 1 ? "ejercicio" : "ejercicios"}
                </p>
              </section>
            </div>
          </div>

          <div className="row pt-b-50">
            <div className="col-12">
              <div className="sessions-list">
                {steps.map((step) => (
                  <Link
                    key={step.id}
                    to={`/entrenamiento/${trainingId}/sesion/${sessionId}/step/${step.id}`}
                    className="session-row"
                  >
                    <span>{step.title}</span>
                    <span className="session-meta">{formatDuration(step.duration_seconds)}</span>
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
