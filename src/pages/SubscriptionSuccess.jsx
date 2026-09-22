import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import subscriptionService from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";

// A donde Stripe redirige tras un checkout exitoso (stripe.success-url en el
// backend), con ?session_id=cs_... agregado por Stripe. GET
// /subscriptions/sync/{sessionId} es un fallback complementario al webhook
// (POST /stripe/webhook, que sigue haciendo falta para renovaciones/
// cancelaciones/pagos fallidos posteriores) — lo llamamos acá para que la
// suscripción quede activa en la BD sin esperar los segundos que puede
// tardar el webhook en llegar solo. Si falla (red, timeout), no bloquea la
// pantalla: el webhook la termina de reflejar igual en segundo plano.
//
// AuthContext.hasSubscription se calcula una sola vez (login o reload) y
// nada más lo vuelve a chequear — sin este refreshSubscription() acá, "Ir a
// entrenamientos" rebotaba de vuelta a /planes: SubscriptionRoute seguía
// viendo el valor viejo (sin suscripción) aunque /subscriptions/me ya
// devolviera la nueva. Se llama después del sync (no en paralelo) para no
// releer la BD antes de que el sync termine de escribir.
const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const sync = sessionId
      ? subscriptionService.syncSubscription(sessionId)
          .catch((error) => console.log("No se pudo sincronizar la suscripción, el webhook la reflejará igual", error))
      : Promise.resolve();

    sync.then(() => refreshSubscription()).finally(() => setSyncing(false));
  }, [sessionId, refreshSubscription]);

  return (
    <div>
      <Header />
      <main>
        <div className="container text-center not-found">
          {syncing ? (
            <>
              <h1>Confirmando tu pago...</h1>
              <p>Esto toma solo un momento.</p>
            </>
          ) : (
            <>
              <IoCheckmarkCircleOutline className="subscription-success-icon" />
              <h1>¡Listo, tu suscripción está activa!</h1>
              <p>Ya puedes empezar a entrenar.</p>
              <Link to="/entrenamientos" className="btn btn-primary">Ir a entrenamientos</Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionSuccess;
