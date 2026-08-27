import api from "./api";

const notificationService = {
  registerDeviceToken: (token) => api.post("/notifications/device-token", { token }),
  unregisterDeviceToken: (token) => api.delete("/notifications/device-token", { body: JSON.stringify({ token }) }),
  getNotifications: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete("/notifications"),
  getPreferences: () => api.get("/users/me/notification-preferences"),
  updatePreferences: (preferences) => api.put("/users/me/notification-preferences", preferences),
};

export default notificationService;
