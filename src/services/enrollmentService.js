import api from "./api";

const enrollmentService = {
  getMyEnrollments: () => api.get("/enrollments/me"),
  getRecentTrainings: () => api.get("/enrollments/me/recent"),
  enrollInTraining: (trainingId) => api.post(`/enrollments/training/${trainingId}`),
  completeSession: (trainingId, sessionId, watchedSeconds) =>
    api.put(`/enrollments/training/${trainingId}/session/${sessionId}/complete`, {
      watched_seconds: watchedSeconds,
    }),
};

export default enrollmentService;
