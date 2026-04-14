import Icon from './Icon'
import AiSymbol from './AiSymbol'
import { BadgeOverlay } from './Badge'

function AiNavRail({
  activeView = 'conversation',
  onViewChange,
  notificationCount = 0,
  className = '',
}) {
  const items = [
    { id: 'conversation', icon: null, label: 'Conversation', useAiSymbol: true },
    { id: 'notifications', icon: 'alert-bold', label: 'Notifications' },
    { id: 'settings', icon: 'settings-bold', label: 'Settings' },
  ]

  return (
    <nav className={`ai-nav-rail ${className}`} aria-label="AI views">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`ai-nav-rail__item${activeView === item.id ? ' ai-nav-rail__item--active' : ''}`}
          aria-label={item.label}
          aria-current={activeView === item.id ? 'page' : undefined}
          onClick={() => onViewChange?.(item.id)}
        >
          <div className="ai-nav-rail__marker">
            {activeView === item.id && <div className="ai-nav-rail__marker-pip" />}
          </div>
          <div className="ai-nav-rail__icon">
            {item.useAiSymbol ? (
              <AiSymbol size={24} />
            ) : item.id === 'notifications' && notificationCount > 0 ? (
              <BadgeOverlay type="counter" count={notificationCount} color="error">
                <Icon name={item.icon} size={24} />
              </BadgeOverlay>
            ) : (
              <Icon name={item.icon} size={24} />
            )}
          </div>
        </button>
      ))}
    </nav>
  )
}

export default AiNavRail
