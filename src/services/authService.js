import api from "./api";

const ROLES_KEY = "fitlan_roles";
const USER_ID_KEY = "fitlan_user_id";

const persistSession = (data) => {
  api.setToken(data.access_token);
  localStorage.setItem(ROLES_KEY, JSON.stringify(data.roles ?? []));
  localStorage.setItem(USER_ID_KEY, String(data.user_id));
};

const authService = {
  // A diferencia de la app móvil (solo login), acá sí se puede crear cuenta nueva.
  // El backend deja la cuenta con active=false hasta verificar el email — no
  // devuelve token todavía, hay que loguear después de verificar.
  register: (username, password, email, name) =>
    api.post("/auth/register", { username, password, email, name }),

  verifyEmail: (token) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  login: async (identifier, password) => {
    const data = await api.post("/auth/login", { identifier, password });
    persistSession(data);
    return data;
  },

  // Sincrónico a propósito. api.post() arma sus headers (con el token todavía
  // válido) en el momento en que se llama, no cuando resuelve — así que se puede
  // disparar sin esperar y de entrada limpiar todo lo local. Si esto esperara
  // (await) al POST antes de limpiar, el logout desde la web (que hace un reload
  // real de página después) recargaría con el token viejo todavía en localStorage
  // durante esa espera.
  logout: () => {
    api.post("/auth/logout").catch((error) => console.log("No se pudo cerrar la sesión en el servidor", error));
    api.clearToken();
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },

  isAuthenticated: () => !!api.getToken(),

  getRoles: () => {
    const stored = localStorage.getItem(ROLES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getUserId: () => {
    const stored = localStorage.getItem(USER_ID_KEY);
    return stored ? Number(stored) : null;
  },

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, new_password: newPassword }),
};

export default authService;
