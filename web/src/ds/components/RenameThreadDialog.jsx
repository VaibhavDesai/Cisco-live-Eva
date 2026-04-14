import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'

function RenameThreadDialog({ open, currentName = '', onSave, onCancel }) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName(currentName)
      setError('')
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [open, currentName])

  if (!open) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Thread name is required')
      return
    }
    if (trimmed.length > 100) {
      setError('Name must be 100 characters or fewer')
      return
    }
    onSave?.(trimmed)
  }

  return (
    <div className="ai-dialog-overlay" onClick={onCancel}>
      <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ai-dialog__header">
          <span className="ai-dialog__title">Rename this thread</span>
          <button type="button" className="ai-dialog__close" aria-label="Close" onClick={onCancel}>
            <Icon name="cancel-bold" size={14} />
          </button>
        </div>
        <div className="ai-dialog__body">
          <div>
            <div className="ai-dialog__input-label">Thread Name</div>
            <input
              ref={inputRef}
              className={`ai-dialog__input${error ? ' ai-dialog__input--error' : ''}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              autoFocus
            />
            {error && <div style={{ color: 'var(--danger-color)', fontSize: 12, marginTop: 4 }}>{error}</div>}
          </div>
        </div>
        <div className="ai-dialog__footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default RenameThreadDialog
