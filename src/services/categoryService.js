import api from "./api";

const categoryService = {
  getCategories: () => api.get("/category"),
};

export default categoryService;
