import { useState, useCallback, useRef, useEffect } from 'react'
import Icon from './Icon'

const VIEW_MODES = [
  { id: 'docked', label: 'Docked', icon: 'side-panel-bold' },
  { id: 'floating', label: 'Floating window', icon: 'fit-to-window-expand-bold' },
  { id: 'fullscreen', label: 'Full screen', icon: 'applications-bold' },
  { id: 'new-tab', label: 'New browser tab', icon: 'pop-out-bold' },
]

function AiContainerHeader({
  title = 'AI Assistant',
  size = 'large',
  viewMode = 'docked',
  onViewModeChange,
  onPopOut,
  onClose,
  onMenuClick,
  className = '',
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const btnRef = useRef(null)

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])

  const selectMode = useCallback(
    (id) => {
      onViewModeChange?.(id)
      setMenuOpen(false)
    },
    [onViewModeChange]
  )

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div
      className={`ai-container-header ai-container-header--${size} ${className}`}
    >
      <div className="ai-container-header__left">
        <div className="ai-container-header__title-group">
          {size === 'small' && (
            <button
              type="button"
              className="ai-container-header__btn"
              aria-label="Menu"
              onClick={onMenuClick}
            >
              <Icon name="list-menu-bold" size={16} />
            </button>
          )}
          <span className="ai-container-header__title">{title}</span>
        </div>
      </div>

      <div className="ai-container-header__btns">
        <button
          type="button"
          className="ai-container-header__btn"
          aria-label="Pop out"
          onClick={onPopOut}
        >
          <Icon name="pop-out-bold" size={16} />
        </button>
        <button
          ref={btnRef}
          type="button"
          className={`ai-container-header__btn${menuOpen ? ' ai-container-header__btn--active' : ''}`}
          aria-label="View mode"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <Icon name="side-panel-bold" size={16} />
        </button>
        <button
          type="button"
          className="ai-container-header__btn"
          aria-label="Close"
          onClick={onClose}
        >
          <Icon name="cancel-bold" size={16} />
        </button>
      </div>

      {menuOpen && (
        <div ref={menuRef} className="ai-size-menu" role="menu">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className="ai-size-menu__item"
              role="menuitem"
              onClick={() => selectMode(mode.id)}
            >
              <span className="ai-size-menu__item-icon">
                <Icon name={mode.icon} size={16} />
              </span>
              <span className="ai-size-menu__item-label">{mode.label}</span>
              {viewMode === mode.id && (
                <span className="ai-size-menu__item-check">
                  <Icon name="check-bold" size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AiContainerHeader
