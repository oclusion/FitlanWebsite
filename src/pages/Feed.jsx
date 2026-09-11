import { useEffect, useState } from "react";
import { IoSearchOutline, IoCloseOutline, IoChevronForward } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrainingCard from "../components/TrainingCard";
import TrainingCardSkeleton from "../components/TrainingCardSkeleton";
import RecentTrainingsRail from "../components/RecentTrainingsRail";
import RecentTrainingsRailSkeleton from "../components/RecentTrainingsRailSkeleton";
import trainingService from "../services/trainingService";
import categoryService from "../services/categoryService";
import enrollmentService from "../services/enrollmentService";

// Puerto de maquetas/assets/includes/feed-training.html — el menú de categorías
// hardcodeado (Box, Yoga, Vinyasa...) se reemplaza por las categorías reales
// (GET /category), y las cards de training vienen de GET /training.
// El menú es multi-selección: se pueden marcar varias categorías y el filtro
// (category_ids=1,2,3) las combina. La selección se guarda en localStorage.
//
// La lupa al inicio del menú abre un buscador por texto (GET /training?search=)
// que reemplaza el menú de categorías mientras está abierto; el tachecito lo
// cierra y vuelve a los filtros. Ojo: el backend pagina siempre que `search`
// está presente (aunque no se mande `page`), así que la respuesta ahí es
// { items, ... } en vez del array plano de siempre — ver trainingService.
const SELECTED_CATEGORIES_KEY = "fitlan_feed_categories";
const SEARCH_DEBOUNCE_MS = 350;

const readStoredCategories = () => {
  try {
    const raw = localStorage.getItem(SELECTED_CATEGORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Feed = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(readStoredCategories);
  const [trainings, setTrainings] = useState([]);
  const [recentTrainings, setRecentTrainings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Independiente del filtro de categoría/búsqueda — se carga una sola vez.
  useEffect(() => {
    enrollmentService.getRecentTrainings()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        // El endpoint puede devolver trainings directo o enrollments con un
        // campo "training" anidado (mismo resguardo que TrainingsScreen.jsx).
        setRecentTrainings(items.map((item) => item.training ?? item));
      })
      .catch((error) => console.log("No se pudieron cargar los recientes", error))
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    categoryService.getCategories()
      .then((data) => {
        setCategories(data);
        // Descartar ids guardados de categorías que ya no existen.
        setSelectedCategoryIds((prev) => prev.filter((id) => data.some((cat) => cat.id === id)));
      })
      .catch((error) => console.log("No se pudieron cargar las categorías", error));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_CATEGORIES_KEY, JSON.stringify(selectedCategoryIds));
    } catch {
      // storage no disponible (modo privado, etc.) — el filtro sigue funcionando en memoria
    }
  }, [selectedCategoryIds]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setLoading(true);
    const search = searchOpen ? debouncedSearch : "";
    trainingService.getTrainings(searchOpen ? [] : selectedCategoryIds, search ? { search } : undefined)
      // Con `search` la respuesta siempre viene paginada ({ items, ... }); sin
      // búsqueda sigue siendo el array plano de siempre.
      .then((data) => setTrainings(Array.isArray(data) ? data : (data.items ?? [])))
      .catch((error) => console.log("No se pudieron cargar los entrenamientos", error))
      .finally(() => setLoading(false));
  }, [selectedCategoryIds, searchOpen, debouncedSearch]);

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
    setDebouncedSearch("");
  };

  return (
    <div className="page">
      <Header />
      <main>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="container-fluid">
                <div className="row">
                  <div className="content p-2">
                    <h1 className="feed-heading"><span>Entrena diferente con</span> Fitlan Academy</h1>
                    <div className="content training-menu">
                      {searchOpen ? (
                        <div className="training-search">
                          {/* Mismo botón (ícono suelto, sin caja) que abre el
                              buscador — homologado con searchToggleButton en
                              TrainingsScreen.jsx, que reutiliza un solo botón
                              con el ícono cambiando entre "search"/"close". */}
                          <button
                            type="button"
                            className="training-search-toggle d-flex align-items-center justify-content-center"
                            onClick={closeSearch}
                            aria-label="Cerrar búsqueda"
                          >
                            <IoCloseOutline />
                          </button>
                          <input
                            type="text"
                            className="training-search-input"
                            placeholder="Buscar entrenamiento..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          {/* La lupa queda fija fuera del carril que scrollea
                              (homologado con filterBarRow/searchIconButton de
                              TrainingsScreen.jsx en rn-starter) — antes
                              compartía el mismo overflow-x:auto que las
                              categorías y podía quedar fuera de vista. */}
                          <button
                            type="button"
                            className="training-search-toggle d-flex align-items-center justify-content-center"
                            onClick={() => setSearchOpen(true)}
                            aria-label="Buscar"
                          >
                            <IoSearchOutline />
                          </button>
                          <div className="scroll-hint-wrap">
                            <div className="training-menu-scroll">
                              <button
                                type="button"
                                className={`box d-flex align-items-center justify-content-center${selectedCategoryIds.length === 0 ? " active" : ""}`}
                                onClick={() => setSelectedCategoryIds([])}
                              >
                                Todas
                              </button>
                              {categories.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={`box d-flex align-items-center justify-content-center${selectedCategoryIds.includes(cat.id) ? " active" : ""}`}
                                  onClick={() => toggleCategory(cat.id)}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                            {/* Puramente decorativa — el degradado ya insinúa
                                que sigue, esto lo hace más explícito. */}
                            <span className="scroll-hint-arrow" aria-hidden="true">
                              <IoChevronForward />
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!searchOpen ? (
                  recentLoading ? (
                    <RecentTrainingsRailSkeleton />
                  ) : (
                    <RecentTrainingsRail trainings={recentTrainings.slice(0, 4)} />
                  )
                ) : null}

                {/* Homologado con trainingsTitle de TrainingsScreen.jsx — a
                    diferencia de "Recientes", este título se muestra también
                    durante la búsqueda (ahí encabeza los resultados). */}
                {loading || trainings.length > 0 ? <h3 className="feed-section-title">Entrenamientos</h3> : null}

                {loading ? (
                  <div className="row g-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <TrainingCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="row g-3">
                    {trainings.map((training) => (
                      <TrainingCard key={training.id} training={training} />
                    ))}
                    {trainings.length === 0 ? <p className="p-2">No hay entrenamientos disponibles.</p> : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Feed;
