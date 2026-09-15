import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import subscriptionService, { hasSubscriptionAccess } from "../services/subscriptionService";

// El backend ya tiene checkout real con Stripe (POST /subscriptions/checkout,
// devuelve la URL hosteada de Stripe a la que se redirige con
// window.location.href — no es un formulario de tarjeta embebido, así que no
// hay datos de pago que pasen por este sitio). "Adquirir" arranca ese
// checkout; el plan actual queda inactivo (no tiene sentido re-comprarlo acá,
// para eso está "Gestionar suscripción" en /cuenta, que abre el Customer
// Portal de Stripe).
const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [checkingOutPlan, setCheckingOutPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

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

  const handleCheckout = async (planId) => {
    setCheckoutError("");
    setCheckingOutPlan(planId);
    try {
      const { url } = await subscriptionService.startCheckout(planId);
      window.location.assign(url);
      // Sin reset de checkingOutPlan acá: la página está por navegar afuera,
      // no hace falta (y evita un parpadeo del botón justo antes de irse).
    } catch (error) {
      console.log("No se pudo iniciar el checkout", error);
      setCheckoutError(error.error || "No se pudo iniciar el pago. Intentá de nuevo en unos minutos.");
      setCheckingOutPlan(null);
    }
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <h1>Planes</h1>
          {checkoutError ? <div className="alert-box mb-3"><p>{checkoutError}</p></div> : null}
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={plan.id === currentPlanId || checkingOutPlan === plan.id}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    {plan.id === currentPlanId
                      ? "Plan actual"
                      : checkingOutPlan === plan.id
                        ? "Redirigiendo..."
                        : "Adquirir"}
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
