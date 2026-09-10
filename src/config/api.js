export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
export const TOKEN_KEY = "fitlan_token";

// El WebSocket de mensajería vive en el mismo host que la API pero fuera de
// /api/v1 (ver README backend, "Mensajería en tiempo real" — endpoint web:
// STOMP sobre SockJS en `<host>/ws`, distinto del `/ws-native` de la app).
export const WS_URL = `${BASE_URL.replace(/\/api\/v1\/?$/, "")}/ws`;
