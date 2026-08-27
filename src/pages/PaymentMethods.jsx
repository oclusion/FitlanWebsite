import Header from "../components/Header";
import Footer from "../components/Footer";

// No hay endpoints de métodos de pago en el backend todavía (no hay integración
// de Stripe expuesta al cliente) — stub honesto en vez de simular una función
// que no existe.
const PaymentMethods = () => (
  <div className="light">
    <Header />
    <main className="pt-b-108">
      <div className="container">
        <h1>Métodos de pago</h1>
        <p>Esta sección todavía no está disponible. Escribinos a soporte@fitlanacademy.mx para gestionar tu método de pago.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default PaymentMethods;
