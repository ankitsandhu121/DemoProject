// Reusable confirmation dialog. Rendered only when `open` is true so tests can
// assert appearance/disappearance.
export default function Modal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" data-testid="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} data-testid="modal">
        <h2 className="modal-title" data-testid="modal-title">
          {title}
        </h2>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          {/* no data-testid: forces a role/name fallback locator on the cancel control */}
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" data-testid="modal-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
