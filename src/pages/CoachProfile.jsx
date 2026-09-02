import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoLogoInstagram, IoLogoFacebook, IoLogoTiktok } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import coachService from "../services/coachService";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";

// Puerto de maquetas/assets/includes/profile.html (era en realidad el perfil de
// un coach, no del usuario propio — mismo dato de prueba, Keftiu Barrón).
const CoachProfile = () => {
  const { id } = useParams();
  const [coach, setCoach] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    coachService.getCoach(id)
      .then((data) => {
        setCoach(data);
        setIsFollowing(data.is_following ?? false);
      })
      .catch((error) => console.log("No se pudo cargar el coach", error));
  }, [id]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    const next = !isFollowing;
    setFollowLoading(true);
    try {
      if (next) await coachService.followCoach(id);
      else await coachService.unfollowCoach(id);
      setIsFollowing(next);
    } catch (error) {
      console.log("No se pudo actualizar el seguimiento", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!coach) {
    return (
      <div>
        <Header />
        <main><div className="container"><p>Cargando...</p></div></main>
        <Footer />
      </div>
    );
  }

  const hasSocial = coach.instagram_url || coach.facebook_url || coach.tiktok_url;

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <div className="profile-row profile-row-centered">
            <div className="profile-photo-wrapper">
              {coach.profile_image_url ? (
                <img
                  src={assetUrl(coach.profile_image_url, coach.profile_image_key)}
                  alt={coach.name}
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo profile-photo-placeholder">{getInitials(coach.name)}</div>
              )}
            </div>

            <h1 className="profile-name">{coach.name}</h1>
            {coach.description ? <p className="profile-text">{coach.description}</p> : null}
            <button className="follow-button" type="button" onClick={handleToggleFollow} disabled={followLoading}>
              {isFollowing ? "Siguiendo" : "Follow"}
            </button>
          </div>

          {hasSocial ? (
            <div className="profile-social profile-social-centered">
              <p className="profile-social-label">Sígueme en:</p>
              <div className="d-flex gap-2 justify-content-center">
                {coach.instagram_url ? (
                  <a href={coach.instagram_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoInstagram /></a>
                ) : null}
                {coach.facebook_url ? (
                  <a href={coach.facebook_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoFacebook /></a>
                ) : null}
                {coach.tiktok_url ? (
                  <a href={coach.tiktok_url} className="social-icon" target="_blank" rel="noreferrer"><IoLogoTiktok /></a>
                ) : null}
              </div>
            </div>
          ) : null}

          {coach.trainings?.length ? (
            <div className="row g-3 pt-b-50 justify-content-center text-center">
              <h3>Entrenamientos</h3>
              {coach.trainings.map((training) => (
                <div key={training.id} className="col-12 col-sm-6 col-lg-3">
                  <Link to={`/entrenamiento/${training.id}`} className="training-card-link">
                    <article className="training-card">
                      {training.image_url ? (
                        <img
                          src={assetUrl(training.image_url, training.image_key)}
                          alt={training.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <div className="training-card-content">
                        <h2>{training.title}</h2>
                      </div>
                    </article>
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachProfile;
