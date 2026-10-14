import { imageUrl } from "../utils/assetUrl";

// Training/session/step traen dos portadas: `image_url` (portrait) e
// `image_landscape_url` (horizontal, agregada al backend para web desktop —
// ver documentacion-backend/README.md). Elegimos una u otra según la
// orientación real del viewport (no el ancho): landscape cubre desktop y
// también un celular rotado, portrait cubre el caso más común en mobile.
// Ambas son opcionales — si falta una, la otra se usa siempre como <img>.
// `item` es el training/session/step; `size` ("sm"/"md", opcional) elige el tamaño a
// descargar (ver imageUrl en utils/assetUrl).
const ResponsiveImage = ({ item, size, alt, className, ...imgProps }) => {
  const portraitSrc = imageUrl(item, "image_url", size);
  const landscapeSrc = imageUrl(item, "image_landscape_url", size);
  const defaultSrc = portraitSrc || landscapeSrc;

  if (!defaultSrc) return null;

  return (
    <picture>
      {landscapeSrc ? <source media="(orientation: landscape)" srcSet={landscapeSrc} /> : null}
      <img src={defaultSrc} alt={alt} className={className} {...imgProps} />
    </picture>
  );
};

export default ResponsiveImage;
