import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import subscriptionService, {
  hasSubscriptionAccess,
  subscriptionStatusMeta,
  isManualSubscriptionError,
} from "../services/subscriptionService";

// Homologado con el flujo recomendado en el README backend ("Flujo
// recomendado en el website" → página /planes): con suscripción activa se
// muestra solo el plan actual + "Gestionar suscripción" (Customer Portal),
// no la grilla de los 3 planes — el backend igual detecta una suscripción
// existente y redirige a checkout ↦ portal si se le pega directo, pero
// mostrar 3 botones "Adquirir" que en realidad abren el portal es confuso.
// Sin suscripción, se muestra la grilla normal con "Adquirir" por plan
// (POST /subscriptions/checkout, devuelve la URL hosteada de Stripe a la
// que se redirige — no es un formulario de tarjeta embebido, no hay datos
// de pago que pasen por este sitio).

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOutPlan, setCheckingOutPlan] = useState(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    Promise.all([
      subscriptionService.getPlans().catch((error) => {
        console.log("No se pudieron cargar los planes", error);
        return [];
      }),
      subscriptionService.getMySubscription().catch((error) => {
        if (error.status !== 404) console.log("No se pudo cargar la suscripción", error);
        return null;
      }),
    ]).then(([plansData, subscriptionData]) => {
      setPlans(plansData);
      setSubscription(subscriptionData);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async (planId) => {
    setActionError("");
    setCheckingOutPlan(planId);
    try {
      const { url } = await subscriptionService.startCheckout(planId);
      window.location.assign(url);
      // Sin reset de checkingOutPlan acá: la página está por navegar afuera,
      // no hace falta (y evita un parpadeo del botón justo antes de irse).
    } catch (error) {
      console.log("No se pudo iniciar el checkout", error);
      setActionError(error.error || "No se pudo iniciar el pago. Intentá de nuevo en unos minutos.");
      setCheckingOutPlan(null);
    }
  };

  const handleManagePortal = async () => {
    setActionError("");
    setManagingPortal(true);
    try {
      const { url } = await subscriptionService.openBillingPortal();
      window.location.assign(url);
    } catch (error) {
      console.log("No se pudo abrir el portal de suscripción", error);
      setActionError(
        isManualSubscriptionError(error)
          ? "Tu plan fue activado manualmente por el equipo de Fitlán — contactanos para hacer cambios."
          : error.error || "No se pudo abrir la gestión de suscripción. Intentá de nuevo en unos minutos.",
      );
      setManagingPortal(false);
    }
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <h1>Planes</h1>
          {actionError ? <div className="alert-box mb-3"><p>{actionError}</p></div> : null}

          {loading ? <p>Cargando...</p> : null}

          {!loading && hasSubscriptionAccess(subscription) ? (
            <article className="plan-card plan-card--current">
              <p className="plan">{subscription.plan_display_name}</p>
              <p className={`plan-status plan-status--${subscriptionStatusMeta(subscription).modifier}`}>
                {subscriptionStatusMeta(subscription).label}
              </p>
              <button type="button" className="btn btn-primary" onClick={handleManagePortal} disabled={managingPortal}>
                {managingPortal ? "Abriendo..." : "Gestionar suscripción"}
              </button>
            </article>
          ) : null}

          {!loading && !hasSubscriptionAccess(subscription) ? (
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
                      disabled={checkingOutPlan === plan.id}
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {checkingOutPlan === plan.id ? "Redirigiendo..." : "Adquirir"}
                    </button>
                  </article>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plans;
