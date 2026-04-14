import { useState, useEffect } from 'react'
import Icon from './Icon'

/**
 * Confirmation dialog for permanently deleting a conversation thread; requires an explicit checkbox before delete.
 * @param {Object} props
 * @param {boolean} props.open - When true, the dialog is shown; when false, renders nothing.
 * @param {string} [props.threadName=''] - Optional label interpolated into the warning body.
 * @param {function(): void} props.onDelete - Invoked when the user confirms deletion (enabled only after confirming).
 * @param {function(): void} props.onCancel - Invoked when the user dismisses the dialog via overlay, close, or Cancel.
 * @example
 * <DeleteThreadDialog open={isOpen} threadName="Weekly sync" onDelete={handleDelete} onCancel={close} />
 */
function DeleteThreadDialog({ open, threadName = '', onDelete, onCancel }) {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) setConfirmed(false)
  }, [open])

  if (!open) return null

  return (
    <div className="ai-dialog-overlay" onClick={onCancel}>
      <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ai-dialog__header">
          <span className="ai-dialog__title">Delete this thread?</span>
          <button type="button" className="ai-dialog__close" aria-label="Close" onClick={onCancel}>
            <Icon name="cancel-bold" size={14} />
          </button>
        </div>
        <div className="ai-dialog__body">
          <p className="ai-dialog__text">
            This will permanently delete the conversation in your thread
            {threadName ? ` "${threadName}"` : ''}. You can&apos;t undo this action.
          </p>
          <label className="ai-dialog__checkbox-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I want to delete this thread
          </label>
        </div>
        <div className="ai-dialog__footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: 'var(--danger-color)' }}
            disabled={!confirmed}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteThreadDialog
