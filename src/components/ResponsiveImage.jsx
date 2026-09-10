import { assetUrl } from "../utils/assetUrl";

// Training/session/step traen dos portadas: `image_url` (portrait) e
// `image_landscape_url` (horizontal, agregada al backend para web desktop —
// ver documentacion-backend/README.md). Elegimos una u otra según la
// orientación real del viewport (no el ancho): landscape cubre desktop y
// también un celular rotado, portrait cubre el caso más común en mobile.
// Ambas son opcionales — si falta una, la otra se usa siempre como <img>.
const ResponsiveImage = ({ url, imageKey, landscapeUrl, landscapeKey, alt, className, ...imgProps }) => {
  const portraitSrc = assetUrl(url, imageKey);
  const landscapeSrc = assetUrl(landscapeUrl, landscapeKey);
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
