// Placeholder de carga para /notificaciones — mismo shape que .notification-card
// (sin los botones de acción, que no aplican mientras carga).
const NotificationCardSkeleton = () => (
  <div className="notification-card" aria-hidden="true">
    <div className="notification-card-main">
      <span className="notification-icon skeleton-line" />
      <span className="notification-info">
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line skeleton-line--meta" />
      </span>
    </div>
  </div>
);

export default NotificationCardSkeleton;
