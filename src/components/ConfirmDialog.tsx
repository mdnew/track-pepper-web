import './ConfirmDialog.css'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  confirmingLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirming = false,
  confirmingLabel = 'Please wait…',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="confirm-dialog-overlay"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="btn-outline"
            disabled={confirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
