import api from "./api";

// Estados de suscripción que todavía dan acceso al contenido (ver README backend).
export const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"];

export const hasSubscriptionAccess = (subscription) =>
  !!subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);

// Texto + color por estado, según la tabla del README backend ("Flujo
// recomendado en el website" → perfil de usuario). Solo cubre los 4 estados
// que dan acceso — GET /subscriptions/me devuelve 404 (no un objeto) para
// el resto (UNPAID, INCOMPLETE, INCOMPLETE_EXPIRED, EXPIRED).
const STATUS_META = {
  ACTIVE: { label: "Activo", modifier: "active" },
  TRIALING: { label: "En prueba", modifier: "trialing" },
  PAST_DUE: { label: "Pago pendiente", modifier: "past-due" },
};

// La cancelación "normal" desde el Customer Portal NO cambia el status (sigue
// ACTIVE/TRIALING/PAST_DUE) — Stripe solo marca cancel_at_period_end: true y
// mantiene el acceso hasta current_period_end. status === "CANCELED" es la
// cancelación inmediata (rara, o hecha desde el admin), un caso aparte.
// Ambos se muestran igual: no importa cuál de los dos causó el vencimiento,
// lo que le importa al usuario es la fecha en la que pierde el acceso.
export const subscriptionStatusMeta = (subscription) => {
  if (subscription.cancel_at_period_end || subscription.status === "CANCELED") {
    const date = new Date(subscription.current_period_end).toLocaleDateString();
    return { label: `Cancela el ${date}`, modifier: "canceled" };
  }
  return STATUS_META[subscription.status] ?? { label: subscription.status, modifier: "active" };
};

// Suscripciones asignadas manualmente desde el admin (sin stripe_customer_id)
// dan 200 en GET /subscriptions/me igual que una de Stripe — el frontend no
// tiene forma de distinguirlas de antemano (el response no expone
// stripe_customer_id, ver README backend), así que "Gestionar suscripción"
// se ofrece siempre con acceso activo, pero si el usuario es de este tipo el
// portal responde 400 con este mensaje puntual. Ahí sí conviene aclarar que
// no es un error transitorio — reintentar no va a arreglar nada.
export const isManualSubscriptionError = (error) =>
  error?.error === "El usuario no tiene un customer de Stripe";

const subscriptionService = {
  getPlans: () => api.get("/subscriptions/plans"),
  // Puede devolver 404 si el usuario no tiene ninguna suscripción — no es un error,
  // hay que manejarlo explícitamente en el caller.
  getMySubscription: () => api.get("/subscriptions/me"),
  // Devuelve { url } — la URL hosteada de Stripe a la que hay que redirigir
  // (window.location.assign, no fetch/XHR). Si el usuario ya tiene una
  // suscripción activa, el backend detecta el duplicado y devuelve la URL
  // del Customer Portal en vez de crear un checkout nuevo — por eso
  // Plans.jsx no ofrece "Adquirir" con una suscripción activa, para no
  // mostrar un botón que en realidad abre el portal. 400 si el plan no
  // tiene stripe_price_id configurado todavía.
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
