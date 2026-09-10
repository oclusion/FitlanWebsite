// Placeholder de carga para /mensajes/nuevo — mismo shape que .coach-search-row.
const CoachRowSkeleton = () => (
  <div className="coach-search-row" aria-hidden="true">
    <span className="coach-search-avatar skeleton-line" />
    <span className="skeleton-line skeleton-line--title coach-search-name-skeleton" />
  </div>
);

export default CoachRowSkeleton;
