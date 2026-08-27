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
};

export default subscriptionService;
