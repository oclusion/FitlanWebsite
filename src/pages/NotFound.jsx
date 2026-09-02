import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Catch-all para rutas que no existen (`<Route path="*">` en App.jsx).
const NotFound = () => (
  <div>
    <Header />
    <main>
      <div className="container text-center not-found">
        <p className="not-found-code">404</p>
        <h1>Esta página no existe</h1>
        <p>Puede que el enlace esté roto o que la página se haya movido.</p>
        <Link to="/" className="btn btn-primary">Ir al inicio</Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
