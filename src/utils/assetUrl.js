const byKey = new Map();

// Las URLs de S3 vienen firmadas al vuelo: la misma imagen/video llega con una
// firma distinta en cada request (`X-Amz-Date` cambia), así que el navegador la
// re-descarga aunque sea el mismo archivo. Memoizamos la primera URL firmada que
// vemos para cada `key` permanente (`image_key`, `profile_image_key`, `video_key`,
// …) y la reusamos el resto de la sesión, para que el `src` no cambie y pegue en
// caché del navegador. Si no hay `key`, se devuelve la URL tal cual.
export const assetUrl = (url, key) => {
  if (!key) return url;
  if (url && !byKey.has(key)) byKey.set(key, url);
  return byKey.get(key) ?? url;
};
