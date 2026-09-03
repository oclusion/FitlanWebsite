import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import contentService from "../services/contentService";
import { IoLogoInstagram, IoLogoTiktok } from "react-icons/io5";
import logoColor from "../assets/img/logo-fitlan.png";

const About = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    contentService.getAboutInfo()
      .then(setContent)
      .catch((error) => console.log("No se pudo cargar la información de la app", error));
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
      <main>
        <div className="container">
          <div className="row">
            <div className="col-12 col-md-6 mx-auto">
              <img src={logoColor} className="logo-about" alt="Fitlan Academy" />
              <h3>{content.mission}</h3>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
