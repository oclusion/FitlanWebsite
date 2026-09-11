import api from "./api";

const trainingService = {
  // Si se pasa `page`, el backend devuelve { items, page, page_size, total_items,
  // total_pages } en vez del array plano de siempre.
  getTrainings: (categoryIds, { page, pageSize, search } = {}) => {
    const params = new URLSearchParams({ status: "PUBLISHED" });
    if (categoryIds?.length) params.set("category_ids", categoryIds.join(","));
    if (search) params.set("search", search);
    if (page !== undefined) {
      params.set("page", page);
      params.set("page_size", pageSize ?? 20);
    }
    return api.get(`/training?${params.toString()}`);
  },
  getTrainingById: (id) => api.get(`/training/${id}`),
  // Sin token, sin video_url/video_key — para la página pública de compartir
  // (/entrenamiento-publico/:id). Ver
  // documentacion-backend/PROPUESTA-training-publico.md (todavía no
  // implementado del lado del backend).
  getPublicTraining: (id) => api.get(`/public/training/${id}`),
};

export default trainingService;
