import { Link } from "react-router-dom";

// La maqueta original tenía columnas de relleno tipo Netflix (tarjetas de regalo,
// relaciones con inversionistas, "XXXXXX"...) que no aplican a Fitlan — acá quedan
// solo los links que realmente existen en la app/sitio.
const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="row">
          <div className="footer col-12 col-md-12">
            <article className="col-12 col-md-4">
              <ul>
                <li><Link to="/faqs">Preguntas frecuentes</Link></li>
                <li><Link to="/ayuda">Centro de ayuda</Link></li>
                <li><Link to="/ayuda">Contáctanos</Link></li>
              </ul>
            </article>
            <article className="col-12 col-md-4">
              <ul>
                <li><Link to="/privacidad">Privacidad y seguridad</Link></li>
                <li><Link to="/acerca-de">Acerca de Fitlán</Link></li>
              </ul>
            </article>
            <article className="col-12 col-md-4">
              <ul>
                <li><Link to="/registro">Crear cuenta</Link></li>
                <li><Link to="/login">Iniciar sesión</Link></li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
