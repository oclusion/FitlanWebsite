import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WorkoutModal from "../components/WorkoutModal";
import sessionService from "../services/sessionService";
import enrollmentService from "../services/enrollmentService";
import { formatDuration } from "../utils/format";

// Puerto de maquetas/assets/includes/steps.html + su modal de workout.
const Steps = () => {
  const { trainingId, sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [activeStepId, setActiveStepId] = useState(null);

  useEffect(() => {
    sessionService.getSessionById(sessionId)
      .then(setSession)
      .catch((error) => console.log("No se pudo cargar la sesión", error));
  }, [sessionId]);

  const handleCompleteStep = (stepId) => {
    const watchedSeconds = session?.steps?.find((s) => s.id === stepId)?.duration_seconds;
    enrollmentService.completeSession(trainingId, sessionId, watchedSeconds)
      .catch((error) => console.log("No se pudo registrar el progreso", error));
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

  const steps = [...(session.steps ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <section className="training-hero">
                {session.image_url ? (
                  <img src={session.image_url} alt={session.title} className="training-hero-image" />
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
            <div className="col-12 col-lg-8">
              <section className="training-description">
                {session.description ? <p>{session.description}</p> : null}
                <p className="training-recommendation">
                  {formatDuration(steps.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0))} en total ·{" "}
                  {steps.length} {steps.length === 1 ? "ejercicio" : "ejercicios"}
                </p>
              </section>
            </div>
            <div className="col-12 col-lg-4">
              <div className="steps-module">
                <h2>Steps</h2>
                {steps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className="step"
                    onClick={() => {
                      setActiveStepId(step.id);
                      handleCompleteStep(step.id);
                    }}
                  >
                    <div className="step-reps">{formatDuration(step.duration_seconds)}</div>
                    <div className="step-description">{step.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {activeStepId ? (
        <WorkoutModal
          steps={steps}
          activeStepId={activeStepId}
          onClose={() => setActiveStepId(null)}
          onSelectStep={(id) => {
            setActiveStepId(id);
            handleCompleteStep(id);
          }}
        />
      ) : null}
    </div>
  );
};

export default Steps;
