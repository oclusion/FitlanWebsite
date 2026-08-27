import api from "./api";

const userService = {
  getMe: () => api.get("/users/me"),
};

export default userService;
