import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoEllipsisVertical } from "react-icons/io5";
import logoColor from "../assets/img/fitlan-color.webp";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

// Puerto a React del maquetas/assets/includes/header.html — el toggle del menú
// mobile pasa de bootstrap.bundle (data-bs-toggle) a estado de React, ya que
// mezclar la manipulación imperativa del DOM de bootstrap.js con el virtual DOM
// de React suele terminar en desincronizaciones.
const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navRef = useRef(null);

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
                <button className="btn-menu" type="button" onClick={() => setMenuOpen((v) => !v)}>
                  <IoEllipsisVertical className="icn-nav" />
                </button>

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
