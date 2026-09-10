// Hero (imagen o video + overlay con título) de TrainingDetail, Steps y
// StepPlayer — misma franja `.training-hero` de las 3, así que comparten este
// placeholder mientras cargan.
const TrainingHeroSkeleton = () => (
  <section className="training-hero" aria-hidden="true">
    <div className="training-hero-skeleton" />
    <div className="training-hero-overlay">
      <div className="training-hero-content">
        <span className="skeleton-line skeleton-line--hero-title" />
      </div>
    </div>
  </section>
);

export default TrainingHeroSkeleton;
