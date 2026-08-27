// Contenido estático (privacidad, ayuda, FAQs, acerca de) — editable desde el panel
// admin (CMS), GET públicos sin token (ver README backend, sección "Contenido
// estático (CMS)").
import api from "./api";

const contentService = {
  getPrivacyPolicy: () => api.get("/content/privacy-policy"),
  getHelpSupport: () => api.get("/content/help-support"),
  getFaqs: () => api.get("/content/faqs"),
  getAboutInfo: () => api.get("/content/about"),
};

export default contentService;
