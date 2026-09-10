import { useEffect, useState } from "react";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrainingCard from "../components/TrainingCard";
import TrainingCardSkeleton from "../components/TrainingCardSkeleton";
import trainingService from "../services/trainingService";
import categoryService from "../services/categoryService";

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
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
                    <h1><span>Entrena diferente con</span> Fitlan Academy</h1>
                    <div className="content training-menu">
                      {searchOpen ? (
                        <div className="training-search">
                          <button
                            type="button"
                            className="training-search-close"
                            onClick={closeSearch}
                            aria-label="Cerrar búsqueda"
                          >
                            <IoCloseOutline />
                          </button>
                          <input
                            type="text"
                            className="training-search-input"
                            placeholder="Buscar entrenamientos"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="box training-search-toggle d-flex align-items-center justify-content-center"
                            onClick={() => setSearchOpen(true)}
                            aria-label="Buscar"
                          >
                            <IoSearchOutline />
                          </button>
                          <button
                            type="button"
                            className={`box d-flex align-items-center justify-content-center${selectedCategoryIds.length === 0 ? " active" : ""}`}
                            onClick={() => setSelectedCategoryIds([])}
                          >
                            Todos
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
                        </>
                      )}
                    </div>
                  </div>
                </div>

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
