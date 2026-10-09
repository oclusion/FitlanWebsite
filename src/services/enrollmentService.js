import api from "./api";

const enrollmentService = {
  getMyEnrollments: () => api.get("/enrollments/me"),
  getRecentTrainings: () => api.get("/enrollments/me/recent"),
  enrollInTraining: (trainingId) => api.post(`/enrollments/training/${trainingId}`),
  completeSession: (trainingId, sessionId, watchedSeconds) =>
    api.put(`/enrollments/training/${trainingId}/session/${sessionId}/complete`, {
      watched_seconds: watchedSeconds,
    }),
  // Segundos vistos de una sesión que el usuario dejó sin terminar (no la marca como completada).
  recordWatchTime: (trainingId, sessionId, watchedSeconds, options) =>
    api.post(`/enrollments/training/${trainingId}/session/${sessionId}/watch-time`, {
      watched_seconds: watchedSeconds,
    }, options),
};

export default enrollmentService;
