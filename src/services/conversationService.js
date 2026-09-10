import api from "./api";

// Puerto 1:1 del conversationService.js de rn-starter — parte REST de la
// mensajería (ver README backend "Mensajería en tiempo real"). La parte en
// vivo vive en chatSocketService.js.
const conversationService = {
  getConversations: () => api.get("/conversations"),
  startConversation: (otherUserId) => api.post("/conversations", { other_user_id: otherUserId }),
  getMessages: (conversationId, { before, limit = 50 } = {}) => {
    const query = new URLSearchParams();
    if (before) query.set("before", before);
    if (limit) query.set("limit", limit);
    return api.get(`/conversations/${conversationId}/messages?${query.toString()}`);
  },
  markMessageAsRead: (conversationId, messageId) =>
    api.put(`/conversations/${conversationId}/messages/${messageId}/read`),
};

export default conversationService;
