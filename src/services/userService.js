import api from "./api";

const userService = {
  getMe: () => api.get("/users/me"),
  // Solo se actualizan los campos incluidos en el body (ver README backend).
  updateMe: (data) => api.put("/users/me", data),
  // Autogestión de certificaciones del propio coach (COACH, ADMIN).
  getMyCertifications: () => api.get("/users/me/certifications"),
  addCertification: (name) => api.post("/users/me/certifications", { name }),
  deleteCertification: (certId) => api.delete(`/users/me/certifications/${certId}`),
};

export default userService;
