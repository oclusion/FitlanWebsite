import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrainingCard from "../components/TrainingCard";
import trainingService from "../services/trainingService";
import categoryService from "../services/categoryService";

// Puerto de maquetas/assets/includes/feed-training.html — el menú de categorías
// hardcodeado (Box, Yoga, Vinyasa...) se reemplaza por las categorías reales
// (GET /category), y las cards de training vienen de GET /training.
// El menú es multi-selección: se pueden marcar varias categorías y el filtro
// (category_ids=1,2,3) las combina. La selección se guarda en localStorage.
const SELECTED_CATEGORIES_KEY = "fitlan_feed_categories";

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
    setLoading(true);
    trainingService.getTrainings(selectedCategoryIds)
      .then(setTrainings)
      .catch((error) => console.log("No se pudieron cargar los entrenamientos", error))
      .finally(() => setLoading(false));
  }, [selectedCategoryIds]);

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="light page">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="container-fluid">
                <div className="row">
                  <div className="content p-2">
                    <h1>Entrena diferente con Fitlan Academy</h1>
                    <div className="content training-menu">
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
                    </div>
                  </div>
                </div>

                {loading ? (
                  <p className="p-2">Cargando...</p>
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
