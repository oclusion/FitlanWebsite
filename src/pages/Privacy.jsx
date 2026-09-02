import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import contentService from "../services/contentService";

const Privacy = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    contentService.getPrivacyPolicy()
      .then(setContent)
      .catch((error) => console.log("No se pudo cargar la política de privacidad", error));
  }, []);

  if (!content) {
    return (
      <div>
        <Header />
        <main><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <h1>Privacidad y seguridad</h1>
          <p className="text-muted">Última actualización: {content.updated_at}</p>
          {content.sections.map((section) => (
            <section key={section.title} className="content-section">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
