import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrainingCard from "../components/TrainingCard";
import trainingService from "../services/trainingService";
import categoryService from "../services/categoryService";

// Puerto de maquetas/assets/includes/feed-training.html — el menú de categorías
// hardcodeado (Box, Yoga, Vinyasa...) se reemplaza por las categorías reales
// (GET /category), y las cards de training vienen de GET /training.
const Feed = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getCategories()
      .then(setCategories)
      .catch((error) => console.log("No se pudieron cargar las categorías", error));
  }, []);

  useEffect(() => {
    setLoading(true);
    trainingService.getTrainings(selectedCategoryId ? [selectedCategoryId] : [])
      .then(setTrainings)
      .catch((error) => console.log("No se pudieron cargar los entrenamientos", error))
      .finally(() => setLoading(false));
  }, [selectedCategoryId]);

  return (
    <div className="light">
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
                        className={`box d-flex align-items-center justify-content-center${selectedCategoryId === null ? " active" : ""}`}
                        onClick={() => setSelectedCategoryId(null)}
                      >
                        Todos
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`box d-flex align-items-center justify-content-center${selectedCategoryId === cat.id ? " active" : ""}`}
                          onClick={() => setSelectedCategoryId(cat.id)}
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
