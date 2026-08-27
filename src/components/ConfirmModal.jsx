import { useEffect } from "react";

// Modal de confirmación custom (sin bootstrap JS), mismo patrón que WorkoutModal:
// overlay con estado de React, clic en el backdrop o Escape para cancelar.
const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {title ? <h2 className="confirm-modal-title">{title}</h2> : null}
        {message ? <p className="confirm-modal-message">{message}</p> : null}
        <div className="confirm-modal-actions">
          <button type="button" className="btn btn-light" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
