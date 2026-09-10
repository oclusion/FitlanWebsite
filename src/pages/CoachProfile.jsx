import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoLogoInstagram, IoLogoFacebook, IoLogoTiktok, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import coachService from "../services/coachService";
import conversationService from "../services/conversationService";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";
import TrainingCard from "../components/TrainingCard";

// Puerto de maquetas/assets/includes/profile.html (era en realidad el perfil de
// un coach, no del usuario propio — mismo dato de prueba, Keftiu Barrón).
const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState(null);

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

  const handleOpenChat = async () => {
    if (startingChat) return;
    setStartingChat(true);
    setChatError(null);
    try {
      const conversation = await conversationService.startConversation(id);
      navigate(`/mensajes/${conversation.id}`);
    } catch (error) {
      setChatError(error.message || "No se pudo iniciar la conversación");
    } finally {
      setStartingChat(false);
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
    <div>
      <Header />
      <main>
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
            <div className="coach-actions-row">
              <button className="follow-button" type="button" onClick={handleToggleFollow} disabled={followLoading}>
                {isFollowing ? "Siguiendo" : "Follow"}
              </button>
              <button className="follow-button chat-button" type="button" onClick={handleOpenChat} disabled={startingChat}>
                <IoChatbubbleEllipsesOutline />
                Chatear
              </button>
            </div>
            {chatError ? <div className="alert-box"><p>{chatError}</p></div> : null}
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
            <div className="row pt-b-50">
              <div className="col-12">
                <h3 className="text-center">Entrenamientos</h3>
                <div className="row g-3 justify-content-center">
                  {coach.trainings.map((training) => (
                    <TrainingCard key={training.id} training={training} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachProfile;
