import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "../config/api";
import api from "./api";

let client = null;
const listeners = new Set();

const notifyListeners = (message) => {
  listeners.forEach((listener) => listener(message));
};

// Puerto de socketService.js (rn-starter) para web: STOMP sobre SockJS en vez
// de WebSocket nativo (ver README backend "WebSocket — Mensajería en tiempo
// real" — la web usa `webSocketFactory` + sockjs-client, no `brokerURL` directo
// como en RN). Un solo socket para toda la app mientras haya sesión activa,
// suscripto a /user/queue/messages.
const connect = () => {
  if (client?.active) return;

  const token = api.getToken();
  if (!token) return;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe("/user/queue/messages", (frame) => {
        try {
          notifyListeners(JSON.parse(frame.body));
        } catch (error) {
          console.log("No se pudo procesar el mensaje entrante", error);
        }
      });
    },
    onStompError: (frame) => {
      console.log("Error STOMP en el chat", frame.headers?.message, frame.body);
    },
    onWebSocketError: (event) => {
      console.log("Error de WebSocket en el chat", event.message ?? event);
    },
  });

  client.activate();
};

const disconnect = () => {
  client?.deactivate();
  client = null;
  listeners.clear();
};

const sendMessage = (conversationId, content) => {
  if (!client?.connected) return;
  client.publish({
    destination: `/app/chat.send/${conversationId}`,
    body: JSON.stringify({ content }),
  });
};

// Devuelve una función para dar de baja el listener.
const addListener = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const chatSocketService = {
  connect,
  disconnect,
  sendMessage,
  addListener,
};

export default chatSocketService;
