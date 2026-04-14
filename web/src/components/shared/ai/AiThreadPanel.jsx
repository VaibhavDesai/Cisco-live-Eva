import { useState, useRef, useEffect } from 'react'
import Icon from '../Icon'

/**
 * Sidebar-style thread list grouped by label (e.g. “Today”), with new-thread, collapse,
 * per-thread overflow (rename/delete), and active-thread highlighting.
 *
 * @param {Object} props
 * @param {Array<{ id: string|number, title: string, group?: string }>} [props.threads=[]] Thread rows to display; optional `group` buckets entries under a section heading.
 * @param {string|number} [props.activeThreadId] Id of the thread shown as selected.
 * @param {function(string|number): void} [props.onSelectThread] Invoked when a thread row is clicked.
 * @param {function(): void} [props.onNewThread] Invoked from the “New thread” control.
 * @param {function(string|number): void} [props.onRenameThread] Invoked from the row menu “Rename” action.
 * @param {function(string|number): void} [props.onDeleteThread] Invoked from the row menu “Delete” action.
 * @param {function(): void} [props.onCollapse] Invoked from the grabber collapse control.
 * @param {string} [props.className=''] Additional CSS class names merged onto the root panel.
 * @example
 * <AiThreadPanel threads={threads} activeThreadId={id} onSelectThread={setId} onNewThread={create} onCollapse={close} />
 */
function AiThreadPanel({
  threads = [],
  activeThreadId,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
  onCollapse,
  className = '',
}) {
  const [menuOpen, setMenuOpen] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null)
    }
    function handleEsc(e) { if (e.key === 'Escape') setMenuOpen(null) }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpen])

  const groups = {}
  threads.forEach((t) => {
    const g = t.group || 'Today'
    if (!groups[g]) groups[g] = []
    groups[g].push(t)
  })

  return (
    <div className={`ai-thread-panel ${className}`}>
      <div className="ai-thread-panel__grabber">
        <div className="ai-thread-panel__grabber-line" />
        <button
          type="button"
          className="ai-thread-panel__grabber-btn"
          aria-label="Collapse threads"
          onClick={onCollapse}
        >
          <Icon name="arrow-left-bold" size={12} />
        </button>
      </div>

      <div className="ai-thread-panel__header">
        <span className="ai-thread-panel__title">Threads</span>
        <div>
          <button
            type="button"
            className="ai-thread-panel__new-btn"
            onClick={onNewThread}
          >
            <Icon name="start-chat-bold" size={16} />
            New thread
          </button>
        </div>
      </div>

      <div className="ai-thread-panel__list">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="ai-thread-panel__group-label">{group}</div>
            {items.map((thread) => (
              <div
                key={thread.id}
                className={`ai-thread-item${activeThreadId === thread.id ? ' ai-thread-item--active' : ''}`}
                onClick={() => onSelectThread?.(thread.id)}
                ref={menuOpen === thread.id ? menuRef : undefined}
              >
                <span className="ai-thread-item__title">{thread.title}</span>
                <button
                  type="button"
                  className="ai-thread-item__menu-btn"
                  aria-label="Thread options"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === thread.id ? null : thread.id)
                  }}
                >
                  <Icon name="more-bold" size={14} />
                </button>
                {menuOpen === thread.id && (
                  <div className="ai-thread-item__context-menu">
                    <button
                      type="button"
                      className="ai-thread-item__context-action"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(null)
                        onRenameThread?.(thread.id)
                      }}
                    >
                      <Icon name="edit-bold" size={16} />
                      Rename
                    </button>
                    <button
                      type="button"
                      className="ai-thread-item__context-action ai-thread-item__context-action--danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(null)
                        onDeleteThread?.(thread.id)
                      }}
                    >
                      <Icon name="delete-bold" size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AiThreadPanel
