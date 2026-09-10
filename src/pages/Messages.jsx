import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoAddCircleOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import conversationService from "../services/conversationService";
import chatSocketService from "../services/chatSocketService";
import authService from "../services/authService";
import ConversationRowSkeleton from "../components/ConversationRowSkeleton";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import { parseServerDate } from "../utils/parseServerDate";

const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  const date = parseServerDate(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
};

// Puerto de MessagesScreen (rn-starter). El buscador para arrancar una
// conversación nueva ("+") solo aplica a usuarios (un coach no puede iniciar
// conversación con otro coach — ver README backend).
const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const canStartConversation = !authService.getRoles().includes("ROLE_COACH");

  useEffect(() => {
    const fetchConversations = () => {
      conversationService.getConversations()
        .then(setConversations)
        .catch((error) => console.log("No se pudieron cargar las conversaciones", error))
        .finally(() => setLoading(false));
    };
    fetchConversations();
    const unsubscribe = chatSocketService.addListener(fetchConversations);
    return unsubscribe;
  }, []);

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <div className="messages-page-header">
            <h1>Mensajes</h1>
            {canStartConversation ? (
              <Link to="/mensajes/nuevo" className="messages-new-btn" aria-label="Nueva conversación">
                <IoAddCircleOutline />
              </Link>
            ) : null}
          </div>

          {loading ? (
            <div className="conversations-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <ConversationRowSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {!loading && conversations.length === 0 ? (
            <p className="text-muted">No tienes conversaciones todavía</p>
          ) : null}

          {!loading && conversations.length > 0 ? (
            <div className="conversations-list">
              {conversations.map((item) => (
                <Link key={item.id} to={`/mensajes/${item.id}`} className="conversation-row">
                  {item.other_profile_image_url ? (
                    <img
                      className="conversation-avatar"
                      src={assetUrl(item.other_profile_image_url, item.other_profile_image_key)}
                      alt={item.other_name}
                    />
                  ) : (
                    <div className="conversation-avatar conversation-avatar--placeholder">
                      {getInitials(item.other_name)}
                    </div>
                  )}
                  <div className="conversation-info">
                    <span className="conversation-name">{item.other_name}</span>
                    <span className="conversation-last-message">{item.last_message ?? "Todavía no hay mensajes"}</span>
                  </div>
                  <div className="conversation-meta">
                    <span className="conversation-time">{formatMessageTime(item.last_message_at)}</span>
                    {item.unread_count > 0 ? (
                      <span className="conversation-unread-badge">{item.unread_count}</span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
