import api from "./api";

const coachService = {
  getCoaches: () => api.get("/users/coaches"),
  getCoach: (coachId) => api.get(`/users/coaches/${coachId}`),
  followCoach: (coachId) => api.post(`/users/coaches/${coachId}/follow`),
  unfollowCoach: (coachId) => api.delete(`/users/coaches/${coachId}/follow`),
};

export default coachService;
