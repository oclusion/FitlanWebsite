const byKey = new Map();

// Las URLs de S3 vienen firmadas al vuelo: la misma imagen/video llega con una
// firma distinta en cada request (`X-Amz-Date` cambia), así que el navegador la
// re-descarga aunque sea el mismo archivo. Memoizamos la primera URL firmada que
// vemos para cada `key` permanente (`image_key`, `profile_image_key`, `video_key`,
// …) y la reusamos, para que el `src` no cambie y pegue en caché del navegador.
// Si no hay `key`, se devuelve la URL tal cual.
//
// Las firmas expiran (pocas horas, configurable en el backend), así que la URL
// memoizada solo se reusa mientras le quede margen de vigencia; si no, se
// reemplaza por la nueva. El margen evita que un video empiece con una URL a
// punto de vencer y falle a mitad de la reproducción (el player sigue pidiendo
// rangos con la misma URL).
const MAX_MARGIN_MS = 45 * 60 * 1000;

// Momento de expiración y vigencia total de una URL prefirmada de S3
// (X-Amz-Date + X-Amz-Expires), o null si no es una URL firmada.
const signatureWindow = (url) => {
  try {
    const params = new URL(url).searchParams;
    const date = params.get("X-Amz-Date");
    const expires = Number(params.get("X-Amz-Expires"));
    if (!date || !expires) return null;
    const signedAt = Date.UTC(
      Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8)),
      Number(date.slice(9, 11)), Number(date.slice(11, 13)), Number(date.slice(13, 15)),
    );
    return { expiresAt: signedAt + expires * 1000, lifetimeMs: expires * 1000 };
  } catch {
    return null;
  }
};

const isStillFresh = (url) => {
  const window = signatureWindow(url);
  if (!window) return true; // URL externa o sin firma: no expira
  const margin = Math.min(MAX_MARGIN_MS, window.lifetimeMs / 2);
  return window.expiresAt - Date.now() > margin;
};

export const assetUrl = (url, key) => {
  if (!key) return url;
  const cached = byKey.get(key);
  if (cached && isStillFresh(cached)) return cached;
  if (url) byKey.set(key, url);
  return url ?? cached;
};

// URL del tamaño adecuado de una imagen del backend: "sm" (320 px) para avatares y miniaturas,
// "md" (800 px) para tarjetas, o sin tamaño para la principal (1600 px, portadas). Las imágenes
// subidas antes de que existieran los tamaños no traen `<campo>_sm`/`_md` y usan la principal.
// Cada tamaño se memoiza con su propio key para no mezclar la miniatura con la portada.
export const imageUrl = (item, field, size) => {
  const key = item?.[field.replace(/_url$/, "_key")];
  const sized = size ? item?.[`${field}_${size}`] : null;
  if (sized) return assetUrl(sized, key ? `${key}_${size}` : undefined);
  return assetUrl(item?.[field], key);
};
