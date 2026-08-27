import { useState } from "react";
import { Link } from "react-router-dom";
import { IoApps } from "react-icons/io5";
import logoColor from "../assets/img/fitlan-color.webp";

// Puerto a React del maquetas/assets/includes/header.html — el toggle del menú
// mobile pasa de bootstrap.bundle (data-bs-toggle) a estado de React, ya que
// mezclar la manipulación imperativa del DOM de bootstrap.js con el virtual DOM
// de React suele terminar en desincronizaciones.
const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="row">
        <div className="header-content">
          <Link to="/inicio">
            <img src={logoColor} className="logo" alt="Fitlan Academy" />
          </Link>

          <button className="btn-menu" type="button" onClick={() => setMenuOpen((v) => !v)}>
            <IoApps className="icn-nav" />
          </button>

          <nav id="menuNav" className={menuOpen ? "collapse show" : "collapse"}>
            <ul>
              <li><Link to="/cuenta" onClick={() => setMenuOpen(false)}>Mi cuenta</Link></li>
              <li><Link to="/mis-entrenamientos" onClick={() => setMenuOpen(false)}>Mis entrenamientos</Link></li>
              <li><Link to="/configuracion" onClick={() => setMenuOpen(false)}>Configuración</Link></li>
              <li><Link to="/metodos-pago" onClick={() => setMenuOpen(false)}>Métodos de pago</Link></li>
              <li><Link to="/ayuda" onClick={() => setMenuOpen(false)}>Ayuda</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
