// Comprime y convierte cualquier imagen a JPEG antes de subirla — fotos de
// cámara/celular llegan pesando varios MB (a veces PNG), esto las deja livianas
// y en un formato consistente para S3. Redimensiona al lado más largo y
// recodifica con <canvas>; si la decodificación falla, sube el archivo tal cual
// en vez de romper el flujo.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

export const toCompressedJpeg = async (file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    console.log("No se pudo decodificar la imagen para comprimir, se sube tal cual", error);
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // JPEG no soporta transparencia — sin este fondo, un PNG con alpha (ícono,
  // captura recortada) terminaría con el área transparente en negro.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
};
