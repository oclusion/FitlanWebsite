import api from "./api";

const sessionService = {
  getSessionById: (id) => api.get(`/session/${id}`),
};

export default sessionService;
