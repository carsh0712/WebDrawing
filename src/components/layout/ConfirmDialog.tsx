interface ConfirmDialogProps {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({ body, confirmLabel, onCancel, onConfirm, title }: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="confirm-dialog-title" aria-modal="true" className="confirm-dialog" role="dialog">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button className="dialog-button secondary" onClick={onCancel} type="button">
            취소
          </button>
          <button className="dialog-button danger" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
