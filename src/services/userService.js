import api from "./api";

const userService = {
  getMe: () => api.get("/users/me"),
  // Solo se actualizan los campos incluidos en el body (ver README backend).
  updateMe: (data) => api.put("/users/me", data),
};

export default userService;
