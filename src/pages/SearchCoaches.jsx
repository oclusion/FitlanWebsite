import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack, IoSearchOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import coachService from "../services/coachService";
import conversationService from "../services/conversationService";
import CoachRowSkeleton from "../components/CoachRowSkeleton";
import { getInitials } from "../utils/initials";
import { assetUrl } from "../utils/assetUrl";

// Puerto de SearchCoachesScreen (rn-starter) — buscador para arrancar una
// conversación nueva con un coach.
const SearchCoaches = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    coachService.getCoaches()
      .then(setCoaches)
      .catch((err) => console.log("No se pudieron cargar los entrenadores", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCoaches = coaches.filter((coach) =>
    coach.name?.toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleOpenChat = async (coach) => {
    if (startingId) return;
    setStartingId(coach.id);
    setError(null);
    try {
      const conversation = await conversationService.startConversation(coach.id);
      navigate(`/mensajes/${conversation.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar la conversación");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <div className="coach-search-header">
            <Link to="/mensajes" className="conversation-back" aria-label="Volver a mensajes">
              <IoArrowBack />
            </Link>
            <h1>Buscar entrenador</h1>
          </div>

          <div className="coach-search-box">
            <IoSearchOutline />
            <input
              type="text"
              placeholder="Buscar entrenador..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoCapitalize="none"
            />
          </div>

          {error ? <div className="alert-box"><p>{error}</p></div> : null}

          {loading ? (
            <div className="coach-search-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <CoachRowSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {!loading && filteredCoaches.length === 0 ? (
            <p className="text-muted">No se encontraron entrenadores</p>
          ) : null}

          {!loading && filteredCoaches.length > 0 ? (
            <div className="coach-search-list">
              {filteredCoaches.map((coach) => (
                <button
                  key={coach.id}
                  type="button"
                  className="coach-search-row"
                  onClick={() => handleOpenChat(coach)}
                  disabled={startingId === coach.id}
                >
                  {coach.profile_image_url ? (
                    <img
                      className="coach-search-avatar"
                      src={assetUrl(coach.profile_image_url, coach.profile_image_key)}
                      alt={coach.name}
                    />
                  ) : (
                    <div className="coach-search-avatar coach-search-avatar--placeholder">
                      {getInitials(coach.name)}
                    </div>
                  )}
                  <span className="coach-search-name">{coach.name}</span>
                  <IoChatbubbleEllipsesOutline className="coach-search-icon" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchCoaches;
