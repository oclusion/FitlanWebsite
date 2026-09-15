import api from "./api";

// Estados de suscripción que todavía dan acceso al contenido (ver README backend).
export const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"];

export const hasSubscriptionAccess = (subscription) =>
  !!subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);

const subscriptionService = {
  getPlans: () => api.get("/subscriptions/plans"),
  // Puede devolver 404 si el usuario no tiene ninguna suscripción — no es un error,
  // hay que manejarlo explícitamente en el caller.
  getMySubscription: () => api.get("/subscriptions/me"),
  // Devuelve { url } — la URL hosteada de Stripe Checkout a la que hay que
  // redirigir (window.location.href, no fetch/XHR). 400 si el plan no tiene
  // stripe_price_id configurado todavía.
  startCheckout: (plan) => api.post("/subscriptions/checkout", { plan }),
  // Devuelve { url } — el Customer Portal de Stripe (cambiar método de pago,
  // ver facturas, cancelar). 400 si el usuario nunca hizo checkout (no tiene
  // stripe_customer_id) — solo se debe ofrecer con una suscripción activa.
  openBillingPortal: () => api.post("/subscriptions/portal"),
  // Fallback complementario al webhook (que sigue haciendo falta para
  // renovaciones/cancelaciones/pagos fallidos posteriores) — llamado desde
  // SubscriptionSuccess.jsx con el ?session_id que trae la redirección de
  // Stripe, para que la suscripción quede activa en la BD sin esperar los
  // segundos que puede tardar el webhook en llegar.
  syncSubscription: (sessionId) => api.get(`/subscriptions/sync/${sessionId}`),
};

export default subscriptionService;
