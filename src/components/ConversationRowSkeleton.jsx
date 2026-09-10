// Placeholder de carga para /mensajes — mismo shape que .conversation-row.
const ConversationRowSkeleton = () => (
  <div className="conversation-row" aria-hidden="true">
    <span className="conversation-avatar skeleton-line" />
    <span className="conversation-info">
      <span className="skeleton-line skeleton-line--title" />
      <span className="skeleton-line skeleton-line--meta" />
    </span>
  </div>
);

export default ConversationRowSkeleton;
