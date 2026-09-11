// Placeholder de carga para el grid de /entrenamientos — mismo grid/shape que
// TrainingCard (misma clase .feed-card, aspect-ratio 3/4) para que el layout
// no salte al llegar los datos reales.
const TrainingCardSkeleton = () => (
  <div className="col-6 col-md-4 col-lg-3 d-flex">
    <div className="feed-card feed-card-skeleton" aria-hidden="true">
      <div className="feed-card-overlay">
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line skeleton-line--meta" />
      </div>
    </div>
  </div>
);

export default TrainingCardSkeleton;
