import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Carousel } from "bootstrap";
import Footer from "../components/Footer";
import subscriptionService from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";
import logoWhite from "../assets/img/fitlan-white.svg";

// Puerto de maquetas/index.php — landing pública. Los planes se traen reales del
// backend (GET /subscriptions/plans) en vez del "$$$$$" placeholder de la maqueta.
// El carrusel usa el JS de Bootstrap (bootstrap se importa en main.jsx). Como el
// DOM lo renderiza React, el auto-init de `data-bs-ride` no lo agarra: se
// instancia a mano en un useEffect y se hace dispose al desmontar.
const Landing = () => {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    subscriptionService.getPlans()
      .then(setPlans)
      .catch((error) => console.log("No se pudieron cargar los planes", error));
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;
    // `ride: "carousel"` = autoplay al montar; `.cycle()` por si acaso.
    const carousel = new Carousel(carouselRef.current, { interval: 4000, ride: "carousel" });
    carousel.cycle();
    return () => carousel.dispose();
  }, []);

  // Si ya hay sesión, no tiene sentido mostrar la landing de marketing — va
  // directo al feed, mismo criterio que ProtectedRoute pero al revés.
  if (isAuthenticated) return <Navigate to="/entrenamientos" replace />;

  return (
    <div className="bg-landing">
      <main>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="col-12 col-md-9 mx-auto text-center">
                <div className="content">
                  <div className="col-12 text-center">
                    <img src={logoWhite} className="logo" alt="Fitlan Academy" />
                  </div>
                  <h1>Entrena Diferente</h1>
                  <div className="col-12 col-md-4 mx-auto">
                    <div ref={carouselRef} id="infoCarousel" className="carousel slide">
                      <div className="carousel-inner">
                        <div className="carousel-item active">
                          <article className="info-block">
                            <p>
                              Accede a box, yoga, atletismo y más con una sola suscripción.
                            </p>
                          </article>
                        </div>
                        <div className="carousel-item">
                          <article className="info-block">
                            <ul>
                              <li>✓ Entrena cuando quieras</li>
                              <li>✓ Instructores especializados</li>
                              <li>✓ Variedad de entrenamientos</li>
                              <li>✓ Cancela cuando quieras</li>
                            </ul>
                          </article>
                        </div>
                      </div>
                      <div className="carousel-indicators">
                        <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1" />
                        <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="1" aria-label="Slide 2" />
                      </div>
                    </div>
                    <Link to="/login" className="btn btn-primary btn-sesion">Iniciar Sesión</Link>
                  </div>

                  {plans.length > 0 ? (
                    <div className="plans row col-12 col-md-12 mx-auto text-center">
                      {plans.map((plan) => (
                        <article key={plan.id} className="col-12 col-md-4">
                          <p className="plan">{plan.display_name}</p>
                          <p>
                            {plan.commitment === "ANNUAL" ? "Pago anual" : "Pago mensual"}
                            {" "}con facturación {plan.billing_cycle === "ANNUAL" ? "anual" : "mensual"}
                          </p>
                          <p>${plan.monthly_price.toFixed(2)}/mes</p>
                          <Link to="/registro" className="btn btn-primary">Comenzar ahora</Link>
                        </article>
                      ))}
                    </div>
                  ) : null}

                </div>

                <div className="info col-12 col-md-12">
                  <h3>Más motivos para unirte:</h3>
                  <div className="content-info row">
                    <article className="col-12 col-md-3">
                      <h4>Entrena a tu ritmo</h4>
                      <p>Accede a todos los cursos cuando quieras y avanza según tus objetivos y nivel de experiencia.</p>
                    </article>
                    <article className="col-12 col-md-3">
                      <h4>Profesionales</h4>
                      <p>Mejora tu técnica con entrenadores expertos en box, yoga, atletismo, karate y más disciplinas.</p>
                    </article>
                    <article className="col-12 col-md-3">
                      <h4>Entrena donde quieras</h4>
                      <p>Accede desde tu celular, tablet o computadora y lleva tu entrenamiento contigo.</p>
                    </article>
                    <article className="col-12 col-md-3">
                      <h4>Nuevos cursos</h4>
                      <p>Descubre nuevas disciplinas, técnicas y entrenamientos para mantener tu progreso en movimiento.</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
