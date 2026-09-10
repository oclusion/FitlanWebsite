// El backend devuelve fechas locales sin zona horaria (ej. "2026-08-25T14:30:00"),
// que en realidad son UTC. Sin indicarle a JS que es UTC, `new Date(...)` la
// interpreta como hora LOCAL del dispositivo — corrimiento igual al offset de
// cada usuario respecto a UTC. Si el string ya trae offset/Z no se toca.
const HAS_TIMEZONE = /Z$|[+-]\d{2}:?\d{2}$/;

export const parseServerDate = (isoString) => {
  if (!isoString) return null;
  return new Date(HAS_TIMEZONE.test(isoString) ? isoString : `${isoString}Z`);
};
