import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// A donde apunta {{COURSE_URL}} en los emails transaccionales del backend
// (en vez de linkear directo a /entrenamiento/{id}) para intentar abrir la
// app nativa primero. Sin auth guard — puede llegar alguien sin sesión en
// el sitio; el destino real (ej. /entrenamiento/:id) ya exige lo que le
// corresponda vía SubscriptionRoute.
//
// Setear window.location a un esquema custom no registrado (fitlan://) no
// interrumpe el JS de esta página en ningún navegador — por eso el
// setTimeout de fallback corre igual si la app no está instalada.
const WEB_PATH_BY_TARGET = {
  training: (id) => `/entrenamiento/${id}`,
};

const APP_REDIRECT_DELAY_MS = 1500;

const OpenLink = () => {
  const [searchParams] = useSearchParams();
  const target = searchParams.get("target");
  const id = searchParams.get("id");

  useEffect(() => {
    const buildWebPath = WEB_PATH_BY_TARGET[target];
    const webPath = id && buildWebPath ? buildWebPath(id) : "/";

    if (!target || !id) {
      window.location.assign(webPath);
      return;
    }

    window.location.assign(`fitlan://${target}/${id}`);
    const timer = setTimeout(() => window.location.assign(webPath), APP_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [target, id]);

  return (
    <div>
      <Header />
      <main>
        <div className="container text-center not-found">
          <p>Abriendo...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpenLink;
