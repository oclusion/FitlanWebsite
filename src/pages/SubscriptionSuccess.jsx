import { Link } from "react-router-dom";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";

// A donde Stripe redirige tras un checkout exitoso (stripe.success-url en el
// backend) — Stripe agrega ?session_id=cs_..., que no necesitamos leer: el
// webhook (POST /stripe/webhook) ya actualiza la suscripción en la BD del
// lado del backend, esto es solo la confirmación visual. La suscripción
// puede tardar unos segundos en reflejarse (el webhook es asíncrono), por
// eso no intenta verificarla acá — /cuenta y /entrenamientos ya la
// recargan solas al visitarlas.
const SubscriptionSuccess = () => (
  <div>
    <Header />
    <main>
      <div className="container text-center not-found">
        <IoCheckmarkCircleOutline className="subscription-success-icon" />
        <h1>¡Listo, tu suscripción está activa!</h1>
        <p>Puede tardar unos segundos en reflejarse. Ya podés empezar a entrenar.</p>
        <Link to="/entrenamientos" className="btn btn-primary">Ir a entrenamientos</Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default SubscriptionSuccess;
