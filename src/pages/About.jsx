import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import contentService from "../services/contentService";
import { IoLogoInstagram, IoLogoTiktok } from "react-icons/io5";
import logoColor from "../assets/img/fitlan-color.webp";

const About = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    contentService.getAboutInfo()
      .then(setContent)
      .catch((error) => console.log("No se pudo cargar la información de la app", error));
  }, []);

  if (!content) {
    return (
      <div className="light">
        <Header />
        <main className="pt-b-108"><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container text-center">
          <img src={logoColor} className="logo" alt="Fitlan Academy" style={{ width: 220, marginBottom: 24 }} />
          <h1>{content.mission}</h1>
          <p>{content.description}</p>
          <a href={content.website_url} target="_blank" rel="noreferrer">{content.website_url.replace("https://", "")}</a>
          <div className="d-flex gap-2 justify-content-center pt-b-50">
            {content.social.instagram_url ? (
              <a href={content.social.instagram_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoInstagram /></a>
            ) : null}
            {content.social.tiktok_url ? (
              <a href={content.social.tiktok_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoTiktok /></a>
            ) : null}
          </div>
          <p className="text-muted pt-b-50">Versión {content.app_version}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
