import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoArrowBack, IoSend } from "react-icons/io5";
import Header from "../components/Header";
import conversationService from "../services/conversationService";
import chatSocketService from "../services/chatSocketService";
import authService from "../services/authService";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import { parseServerDate } from "../utils/parseServerDate";

const PAGE_SIZE = 50;
// No hay endpoint de "marcar todos como leídos": hay que pegarle al PUT por
// mensaje. Limitamos cuántos van en paralelo para no disparar cientos de
// requests de golpe al abrir una conversación con mucho historial sin leer.
const CONCURRENT_READ_REQUESTS = 5;

const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  return parseServerDate(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDaySeparator = (isoString) => {
  const date = parseServerDate(isoString);
  const now = new Date();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const markMessagesAsRead = (conversationId, messageIds) => {
  const queue = [...messageIds];
  const worker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      await conversationService.markMessageAsRead(conversationId, id)
        .catch((error) => console.log("No se pudo marcar el mensaje como leído", error));
    }
  };
  const workerCount = Math.min(CONCURRENT_READ_REQUESTS, messageIds.length);
  return Promise.all(Array.from({ length: workerCount }, worker));
};

// Puerto de ChatScreen (rn-starter). Historial vía REST (paginado por cursor),
// mensajes en vivo vía chatSocketService. A diferencia de la app (FlatList
// `inverted`), acá se renderiza en orden cronológico normal y se hace scroll
// al final — no hace falta el truco de invertir la lista.
const Conversation = () => {
  const { conversationId } = useParams();
  const myUserId = authService.getUserId();
  const threadRef = useRef(null);
  // Cuando se insertan mensajes viejos arriba (load more) hay que mantener la
  // posición visual en vez de anclar abajo — ver el layout effect más abajo.
  const prependScrollHeightRef = useRef(null);
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  useEffect(() => {
    conversationService.getConversations()
      .then((list) => {
        const conversation = list.find((c) => String(c.id) === String(conversationId));
        if (conversation) {
          setContact({
            name: conversation.other_name,
            profile_image_url: conversation.other_profile_image_url,
            profile_image_key: conversation.other_profile_image_key,
          });
        }
      })
      .catch((error) => console.log("No se pudo cargar la conversación", error));
  }, [conversationId]);

  // Historial: ya viene cronológico (más viejo primero) del backend, no hace
  // falta invertir nada. Marca como leídos los mensajes del otro participante
  // que todavía no lo estaban (así se limpia el badge de Mensajes/Header).
  useEffect(() => {
    conversationService.getMessages(conversationId, { limit: PAGE_SIZE })
      .then((history) => {
        setMessages(history);
        setHasMoreHistory(history.length === PAGE_SIZE);
        const unreadIds = history.filter((m) => !m.read && m.sender_id !== myUserId).map((m) => m.id);
        if (unreadIds.length > 0) markMessagesAsRead(conversationId, unreadIds);
      })
      .catch((error) => console.log("No se pudo cargar el historial de la conversación", error))
      .finally(() => setLoading(false));
  }, [conversationId, myUserId]);

  // Auto-scroll: al llegar mensajes nuevos (propios, en vivo, o la carga
  // inicial) se ancla abajo; al insertar mensajes viejos arriba (load more)
  // se mantiene la posición visual en vez de saltar — layout effect porque
  // tiene que correr antes del paint, sin parpadeo.
  useLayoutEffect(() => {
    const container = threadRef.current;
    if (!container) return;
    if (prependScrollHeightRef.current != null) {
      container.scrollTop = container.scrollHeight - prependScrollHeightRef.current;
      prependScrollHeightRef.current = null;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMoreHistory || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0].id;
    conversationService.getMessages(conversationId, { before: oldestId, limit: PAGE_SIZE })
      .then((older) => {
        setHasMoreHistory(older.length === PAGE_SIZE);
        if (older.length > 0) {
          prependScrollHeightRef.current = threadRef.current?.scrollHeight ?? 0;
          setMessages((prev) => [...older, ...prev]);
          const unreadIds = older.filter((m) => !m.read && m.sender_id !== myUserId).map((m) => m.id);
          if (unreadIds.length > 0) markMessagesAsRead(conversationId, unreadIds);
        }
      })
      .catch((error) => console.log("No se pudieron cargar mensajes anteriores", error))
      .finally(() => setLoadingMore(false));
  };

  // Paginado real: al acercarse al tope del historial visible, se pide la
  // página anterior sola (sin botón), como cualquier chat.
  const handleThreadScroll = () => {
    if (threadRef.current && threadRef.current.scrollTop < 80) handleLoadMore();
  };

  // Mensajes en vivo: filtramos solo los de esta conversación (el socket
  // recibe los de todas, ya que /user/queue/messages es por usuario).
  useEffect(() => {
    const unsubscribe = chatSocketService.addListener((message) => {
      if (String(message.conversation_id) !== String(conversationId)) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.sender_id !== myUserId) {
        conversationService.markMessageAsRead(conversationId, message.id)
          .catch((error) => console.log("No se pudo marcar el mensaje como leído", error));
      }
    });
    return unsubscribe;
  }, [conversationId, myUserId]);

  const handleSend = (event) => {
    event.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    chatSocketService.sendMessage(conversationId, trimmed);
    setInputText("");
  };

  const messagesWithSeparators = [];
  messages.forEach((message, index) => {
    const prev = messages[index - 1];
    const sameDay = prev && parseServerDate(prev.sent_at).toDateString() === parseServerDate(message.sent_at).toDateString();
    if (!sameDay) {
      messagesWithSeparators.push({ type: "separator", id: `separator-${message.id}`, label: formatDaySeparator(message.sent_at) });
    }
    messagesWithSeparators.push({ type: "message", data: message });
  });

  return (
    <div>
      <Header />
      <main className="conversation-page">
        <div className="container conversation-header">
          <Link to="/mensajes" className="conversation-back" aria-label="Volver a mensajes">
            <IoArrowBack />
          </Link>
          {contact ? (
            <>
              {contact.profile_image_url ? (
                <img
                  className="conversation-header-avatar"
                  src={assetUrl(contact.profile_image_url, contact.profile_image_key)}
                  alt={contact.name}
                />
              ) : (
                <div className="conversation-header-avatar conversation-header-avatar--placeholder">
                  {getInitials(contact.name)}
                </div>
              )}
              <span className="conversation-header-name">{contact.name}</span>
            </>
          ) : (
            <>
              <span className="conversation-header-avatar skeleton-line" aria-hidden="true" />
              <span className="skeleton-line conversation-header-name-skeleton" aria-hidden="true" />
            </>
          )}
        </div>

        <div className="conversation-thread" ref={threadRef} onScroll={handleThreadScroll}>
          <div className="container conversation-thread-inner">
            {loading ? (
              <>
                <div className="conversation-bubble-row">
                  <span className="conversation-bubble-skeleton skeleton-line" aria-hidden="true" />
                </div>
                <div className="conversation-bubble-row conversation-bubble-row--mine">
                  <span className="conversation-bubble-skeleton skeleton-line" aria-hidden="true" />
                </div>
                <div className="conversation-bubble-row">
                  <span className="conversation-bubble-skeleton skeleton-line" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                {loadingMore ? <p className="conversation-loading-more">Cargando mensajes anteriores...</p> : null}

                {messagesWithSeparators.map((item) =>
                  item.type === "separator" ? (
                    <div key={item.id} className="conversation-day-separator">
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    <div
                      key={item.data.id}
                      className={`conversation-bubble-row${item.data.sender_id === myUserId ? " conversation-bubble-row--mine" : ""}`}
                    >
                      <div className={`conversation-bubble${item.data.sender_id === myUserId ? " conversation-bubble--mine" : ""}`}>
                        {item.data.content}
                      </div>
                      <span className="conversation-bubble-time">{formatMessageTime(item.data.sent_at)}</span>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        <form className="container conversation-input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="conversation-input"
            placeholder="Escribí un mensaje..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="conversation-send-btn" disabled={!inputText.trim()} aria-label="Enviar">
            <IoSend />
          </button>
        </form>
      </main>
    </div>
  );
};

export default Conversation;
