import AiContainerHeader from './AiContainerHeader'

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
