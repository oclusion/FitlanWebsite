import { BASE_URL, TOKEN_KEY } from "../config/api";

// Mismo contrato que src/services/api.js de la app móvil (RN): un solo request()
// que inyecta el token, y en 401 con token activo fuerza logout — acá redirigiendo
// a /login en vez de resetear un stack de navegación nativo.
let _token = localStorage.getItem(TOKEN_KEY);

const setToken = (token) => {
  _token = token;
  localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = () => {
  _token = null;
  localStorage.removeItem(TOKEN_KEY);
};

const request = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (response.status === 401) {
    if (_token) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw { status: 401, ...data };
  }

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
};

const api = {
  get: (endpoint, options) =>
    request(endpoint, { method: "GET", ...options }),

  post: (endpoint, body, options) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body), ...options }),

  put: (endpoint, body, options) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body), ...options }),

  patch: (endpoint, options) =>
    request(endpoint, { method: "PATCH", ...options }),

  delete: (endpoint, options) =>
    request(endpoint, { method: "DELETE", ...options }),

  setToken,
  clearToken,
  getToken: () => _token,
};

export default api;
