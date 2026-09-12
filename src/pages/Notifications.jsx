import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoEllipsisVertical,
  IoMailOpenOutline,
  IoTrashOutline,
  IoNotificationsOffOutline,
  IoBarbellOutline,
  IoTrophyOutline,
  IoTimeOutline,
  IoPricetagOutline,
  IoFlameOutline,
  IoCardOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import notificationService from "../services/notificationService";
import NotificationCardSkeleton from "../components/NotificationCardSkeleton";
import { parseServerDate } from "../utils/parseServerDate";

// Puerto de NotificationsScreen (rn-starter). El swipe-to-reveal (marcar
// leída / borrar) de la app no existe en web — en vez de requerir un gesto,
// esos dos botones quedan siempre visibles, pero discretos (ghost, dentro de
// la misma card) en vez de dos cuadros de color grandes al costado.
const iconByType = {
  NEW_TRAINING: IoBarbellOutline,
  WEEKLY_ACHIEVEMENT: IoTrophyOutline,
  DAILY_REMINDER: IoTimeOutline,
  NEW_CATEGORY: IoPricetagOutline,
  STREAK: IoFlameOutline,
  SUBSCRIPTION_EXPIRING: IoCardOutline,
};

const formatNotificationTime = (isoString) => {
  const date = parseServerDate(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Hace un momento";
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    notificationService.getNotifications()
      .then(setNotifications)
      .catch((error) => console.log("No se pudieron cargar las notificaciones", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [menuOpen]);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notificationService.markAsRead(id)
      .catch((error) => console.log("No se pudo marcar la notificación como leída", error));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationService.deleteNotification(id)
      .catch((error) => console.log("No se pudo eliminar la notificación", error));
  };

  const handleMarkAllRead = () => {
    setMenuOpen(false);
    if (!window.confirm("¿Marcar todas las notificaciones como leídas?")) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllAsRead()
      .catch((error) => console.log("No se pudieron marcar todas como leídas", error));
  };

  const handleDeleteAll = () => {
    setMenuOpen(false);
    if (!window.confirm("¿Borrar todas las notificaciones? Esta acción no se puede deshacer.")) return;
    setNotifications([]);
    notificationService.deleteAllNotifications()
      .catch((error) => console.log("No se pudo borrar el historial de notificaciones", error));
  };

  // Navegación desde el centro de notificaciones (ver README backend): sin
  // pantalla de video persistente en el sitio (cada ruta es su propia página),
  // así que a diferencia de la app no hace falta bloquear la navegación cuando
  // se está reproduciendo un video.
  const handleOpenNotification = (item) => {
    if (!item.read) handleMarkAsRead(item.id);

    const trainingId = item.action_data?.training_id;
    if ((item.type === "NEW_TRAINING" || item.type === "DAILY_REMINDER") && trainingId) {
      // TrainingDetail ya resuelve a dónde ir según la forma del training
      // (ficha, sesión o step directo) — no hace falta replicar esa lógica acá.
      navigate(`/entrenamiento/${trainingId}`);
      return;
    }
    if (item.type === "DAILY_REMINDER") {
      navigate("/entrenamientos");
      return;
    }
    if (item.type === "SUBSCRIPTION_EXPIRING") {
      navigate("/planes");
    }
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <div className="notifications-page-header">
            <h1>Notificaciones</h1>
            {notifications.length > 0 ? (
              <div className="notifications-menu-wrapper" ref={menuRef}>
                <button
                  type="button"
                  className="notifications-menu-toggle"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Más opciones"
                >
                  <IoEllipsisVertical />
                </button>
                {menuOpen ? (
                  <div className="notifications-menu">
                    <button type="button" className="notifications-menu-item" onClick={handleMarkAllRead}>
                      <IoMailOpenOutline />
                      Marcar todas como leídas
                    </button>
                    <button type="button" className="notifications-menu-item notifications-menu-item--danger" onClick={handleDeleteAll}>
                      <IoTrashOutline />
                      Borrar todas
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="notifications-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <NotificationCardSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {!loading && notifications.length === 0 ? (
            <div className="notifications-empty">
              <IoNotificationsOffOutline />
              <p>No tienes notificaciones</p>
            </div>
          ) : null}

          {!loading && notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications.map((item) => {
                const Icon = iconByType[item.type] ?? IoNotificationsOutline;
                return (
                  <div key={item.id} className={`notification-card${!item.read ? " notification-card--unread" : ""}`}>
                    {/* Ya no es <button> (no puede anidar los de "acciones" abajo) —
                        mismo rol/teclado que uno vía role="button" + onKeyDown. */}
                    <div
                      className="notification-card-main"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenNotification(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenNotification(item);
                        }
                      }}
                    >
                      <span className="notification-icon"><Icon /></span>
                      <span className="notification-info">
                        <span className="notification-title">{item.title}</span>
                        <span className="notification-message">{item.body}</span>
                        <span className="notification-time">{formatNotificationTime(item.created_at)}</span>
                      </span>
                      {!item.read ? <span className="notification-unread-dot" /> : null}
                    </div>
                    <div className="notification-actions">
                      {!item.read ? (
                        <button
                          type="button"
                          className="notification-action"
                          onClick={() => handleMarkAsRead(item.id)}
                          aria-label="Marcar como leída"
                        >
                          <IoMailOpenOutline />
                          Leída
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="notification-action notification-action--danger"
                        onClick={() => handleDelete(item.id)}
                        aria-label="Eliminar"
                      >
                        <IoTrashOutline />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
