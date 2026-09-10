import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoEllipsisVertical, IoNotificationsOutline, IoChatbubbleOutline } from "react-icons/io5";
import logoColor from "../assets/img/fitlan-color.png";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import notificationService from "../services/notificationService";
import conversationService from "../services/conversationService";
import chatSocketService from "../services/chatSocketService";

// Cada cuánto se re-consulta el conteo de no leídos por polling (además de al
// montar y de cada mensaje en vivo que llega por el socket).
const UNREAD_POLL_MS = 30000;
const totalUnreadMessages = (conversations) =>
  conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);

// Puerto a React del maquetas/assets/includes/header.html — el toggle del menú
// mobile pasa de bootstrap.bundle (data-bs-toggle) a estado de React, ya que
// mezclar la manipulación imperativa del DOM de bootstrap.js con el virtual DOM
// de React suele terminar en desincronizaciones.
const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navRef = useRef(null);

  // Badges de notificaciones/mensajes — por polling (no hay canal en vivo para
  // notificaciones) y, para mensajes, también apenas llega uno por el socket
  // (ver chatSocketService), sin esperar al próximo poll.
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadNotifications = () => {
      notificationService.getUnreadCount()
        .then((data) => setUnreadNotifications(data.unread_count ?? 0))
        .catch((error) => console.log("No se pudo obtener el conteo de notificaciones", error));
    };
    const fetchUnreadMessages = () => {
      conversationService.getConversations()
        .then((data) => setUnreadMessages(totalUnreadMessages(data)))
        .catch((error) => console.log("No se pudo obtener el conteo de mensajes", error));
    };

    fetchUnreadNotifications();
    fetchUnreadMessages();
    const interval = setInterval(() => {
      fetchUnreadNotifications();
      fetchUnreadMessages();
    }, UNREAD_POLL_MS);
    const unsubscribe = chatSocketService.addListener(fetchUnreadMessages);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isAuthenticated]);

  // Cerrar el menú mobile al hacer clic fuera de él (o al presionar Escape).
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointer = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header>
        <div className="row">
          <div className="header-content" ref={navRef}>
            <Link to={isAuthenticated ? "/entrenamientos" : "/"}>
              <img src={logoColor} className="logo" alt="Fitlan Academy" />
            </Link>

            {isAuthenticated ? (
              <>
                <div className="header-right">
                  <Link to="/notificaciones" className="header-icon-btn" aria-label="Notificaciones">
                    <IoNotificationsOutline className="icn-nav" />
                    {unreadNotifications > 0 ? (
                      <span className="header-icon-badge">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                    ) : null}
                  </Link>
                  <Link to="/mensajes" className="header-icon-btn" aria-label="Mensajes">
                    <IoChatbubbleOutline className="icn-nav" />
                    {unreadMessages > 0 ? (
                      <span className="header-icon-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                    ) : null}
                  </Link>

                  <button className="btn-menu" type="button" onClick={() => setMenuOpen((v) => !v)}>
                    <IoEllipsisVertical className="icn-nav" />
                  </button>
                </div>

                <nav id="menuNav" className={menuOpen ? "collapse show" : "collapse"}>
                  <ul>
                    <li><Link to="/cuenta" onClick={() => setMenuOpen(false)}>Mi cuenta</Link></li>
                    <li><Link to="/mis-entrenamientos" onClick={() => setMenuOpen(false)}>Mis entrenamientos</Link></li>
                    <li><Link to="/configuracion" onClick={() => setMenuOpen(false)}>Configuración</Link></li>
                    <li><Link to="/ayuda" onClick={() => setMenuOpen(false)}>Ayuda</Link></li>
                    <li>
                      <button
                        type="button"
                        className="menu-logout"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {showLogoutConfirm ? (
        <ConfirmModal
          title="Cerrar sesión"
          message="¿Seguro que deseas salir?"
          confirmLabel="Cerrar sesión"
          cancelLabel="Cancelar"
          onConfirm={logout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      ) : null}
    </>
  );
};

export default Header;
