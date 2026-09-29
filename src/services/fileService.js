import api from "./api";

// POST /files/upload (ver README backend, "Archivos (S3)") — devuelve
// { key, url }. El key es el identificador permanente a reenviar en el
// campo *_url correspondiente (ej. profile_image_url) al actualizar el
// recurso — así lo documenta el backend, aunque el nombre del campo diga
// "url": no es la URL firmada, es el key crudo.
const fileService = {
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload("/files/upload", formData);
  },
};

export default fileService;
