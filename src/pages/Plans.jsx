import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import subscriptionService from "../services/subscriptionService";

// No existe todavía un endpoint de checkout/pago en el backend (solo GET
// /subscriptions/plans y /subscriptions/me son de solo lectura) — esta pantalla
// muestra los planes de forma informativa. Cuando exista el flujo de pago real,
// el botón de cada plan se conecta ahí.
const Plans = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    subscriptionService.getPlans()
      .then(setPlans)
      .catch((error) => console.log("No se pudieron cargar los planes", error));
  }, []);

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <h1>Planes</h1>
          <div className="row g-3">
            {plans.map((plan) => (
              <div key={plan.id} className="col-12 col-md-4">
                <article className="plan-card">
                  <p className="plan">{plan.display_name}</p>
                  <p>
                    {plan.commitment === "ANNUAL" ? "Compromiso anual" : "Sin compromiso"} · facturación{" "}
                    {plan.billing_cycle === "ANNUAL" ? "anual" : "mensual"}
                  </p>
                  <p className="plan-price">${plan.monthly_price.toFixed(2)}/mes</p>
                  <a href="mailto:soporte@fitlanacademy.mx?subject=Quiero activar un plan" className="btn btn-primary">
                    Contactar para activar
                  </a>
                </article>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plans;
