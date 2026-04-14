import AiContainerHeader from './AiContainerHeader'

/**
 * Renders the AI assistant shell as a dialog with overlay, header chrome, and body slot for nested content.
 * Maps internal view modes for layout and wires header controls to resize, pop-out, and close behavior.
 * Any extra props are spread onto the root `div` with `role="dialog"` (e.g. `data-*` or ARIA attributes).
 *
 * @param {Object} props
 * @param {boolean} [props.open=false] Whether the shell is visible; when false, nothing is rendered.
 * @param {string} [props.viewMode='floating-lg'] Shell layout mode (e.g. floating sizes, docked, fullscreen).
 * @param {Function} [props.onClose] Called when the user closes the shell (e.g. overlay click or header close).
 * @param {Function} [props.onViewModeChange] Called with the next shell mode when the user changes layout from the header.
 * @param {import('react').ReactNode} [props.children] Main panel content rendered inside the shell body.
 * @param {string} [props.className=''] Additional class names merged onto the root shell element.
 * @example
 * <AiShell open viewMode="floating-lg" onClose={() => {}} onViewModeChange={() => {}}>
 *   <p>Content</p>
 * </AiShell>
 */
const VIEW_MODE_MAP = {
  'floating-lg': 'floating',
  'floating-sm': 'floating',
  docked: 'docked',
  fullscreen: 'fullscreen',
}

const SHELL_MODE_MAP = {
  docked: 'docked',
  floating: 'floating-lg',
  fullscreen: 'fullscreen',
  'new-tab': 'floating-lg',
}

function AiShell({
  open = false,
  viewMode = 'floating-lg',
  onClose,
  onViewModeChange,
  children,
  className = '',
  ...rest
}) {
  if (!open) return null

  const cls = [
    'ai-shell',
    `ai-shell--${viewMode}`,
    className,
  ].filter(Boolean).join(' ')

  const isSmall = viewMode === 'floating-sm' || viewMode === 'docked'
  const headerViewMode = VIEW_MODE_MAP[viewMode] || 'floating'

  const handleViewModeSelect = (id) => {
    const shellMode = SHELL_MODE_MAP[id]
    if (shellMode && shellMode !== viewMode) {
      onViewModeChange?.(shellMode)
    }
  }

  const handlePopOut = () => {
    onViewModeChange?.(viewMode === 'floating-lg' ? 'floating-sm' : 'floating-lg')
  }

  return (
    <>
      {viewMode !== 'docked' && (
        <div className="ai-shell-overlay" onClick={onClose} />
      )}
      <div className={cls} role="dialog" aria-label="AI Assistant" {...rest}>
        <AiContainerHeader
          size={isSmall ? 'small' : 'large'}
          viewMode={headerViewMode}
          onViewModeChange={handleViewModeSelect}
          onPopOut={handlePopOut}
          onClose={onClose}
        />
        <div className="ai-shell__body">
          {children}
        </div>
      </div>
    </>
  )
}

export default AiShell
