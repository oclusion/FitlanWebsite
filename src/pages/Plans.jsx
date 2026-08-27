import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import subscriptionService, { hasSubscriptionAccess } from "../services/subscriptionService";

// No existe todavía un endpoint de checkout/pago en el backend (solo GET
// /subscriptions/plans y /subscriptions/me son de solo lectura) — esta pantalla
// muestra los planes de forma informativa. El botón "Adquirir" todavía no hace
// nada; queda inactivo en el plan que el usuario ya tiene. Cuando exista el flujo
// de pago real se conecta ahí.
const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    subscriptionService.getPlans()
      .then(setPlans)
      .catch((error) => console.log("No se pudieron cargar los planes", error));
    subscriptionService.getMySubscription()
      .then(setSubscription)
      .catch((error) => {
        if (error.status !== 404) console.log("No se pudo cargar la suscripción", error);
        setSubscription(null);
      });
  }, []);

  const currentPlanId = hasSubscriptionAccess(subscription) ? subscription.plan : null;

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
                  <button type="button" className="btn btn-primary" disabled={plan.id === currentPlanId}>
                    {plan.id === currentPlanId ? "Plan actual" : "Adquirir"}
                  </button>
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
