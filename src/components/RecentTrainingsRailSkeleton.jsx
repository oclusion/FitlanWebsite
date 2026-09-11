// Placeholder de carga para el riel de "Recientes" (mientras resuelve GET
// /enrollments/me/recent) — mismo patrón que TrainingCardSkeleton (clases
// .feed-card/-skeleton), sin el wrapper de scroll-hint: es un estado
// transitorio, no hace falta insinuar que scrollea.
const RecentTrainingsRailSkeleton = () => (
  <div className="recent-trainings">
    <h3 className="feed-section-title">Recientes</h3>
    <div className="recent-trainings-scroll">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="feed-card recent-card feed-card-skeleton" aria-hidden="true">
          <div className="feed-card-overlay">
            <span className="skeleton-line skeleton-line--title" />
            <span className="skeleton-line skeleton-line--meta" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RecentTrainingsRailSkeleton;
