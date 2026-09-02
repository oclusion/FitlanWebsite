import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoMailOutline, IoLogoWhatsapp } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import contentService from "../services/contentService";

const Help = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    contentService.getHelpSupport()
      .then(setContent)
      .catch((error) => console.log("No se pudo cargar la información de soporte", error));
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
    <div>
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <h1>Ayuda y soporte</h1>

          <h1>Contáctanos</h1>
          <div className="contact-list">
            <a href={`mailto:${content.contact_email}`} className="contact-row">
              <IoMailOutline /> {content.contact_email}
            </a>
            <a href={content.whatsapp_url} className="contact-row" target="_blank" rel="noreferrer">
              <IoLogoWhatsapp /> WhatsApp
            </a>
          </div>

          <h3>Temas frecuentes</h3>
          {content.topics.map((topic) => (
            <div key={topic.id} className="content-section">
              <h4>{topic.title}</h4>
              <p>{topic.body}</p>
            </div>
          ))}

          <Link to="/faqs" className="btn btn-light">Ver todas las preguntas frecuentes</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Help;
