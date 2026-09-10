// Fila del listado de sesiones (TrainingDetail) o de steps (Steps) — mismo
// shape que .session-row.
const SessionRowSkeleton = () => (
  <div className="session-row session-row-skeleton" aria-hidden="true">
    <span className="skeleton-line skeleton-line--row-title" />
    <span className="skeleton-line skeleton-line--row-meta" />
  </div>
);

export default SessionRowSkeleton;
