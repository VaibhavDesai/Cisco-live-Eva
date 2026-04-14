import Icon from '../Icon'
import AiSymbol from './AiSymbol'
import { BadgeOverlay } from '../Badge'

/**
 * Vertical icon rail for switching AI shell views (conversation, notifications, settings) with active marker and optional counter badge.
 * @param {Object} props - Navigation rail state for switching between AI shell views.
 * @param {'conversation'|'notifications'|'settings'} [props.activeView='conversation'] - Which rail item is visually active and announced as current.
 * @param {function(string): void} [props.onViewChange] - Called with the item `id` when a rail button is activated.
 * @param {number} [props.notificationCount=0] - When greater than zero, overlays an error counter badge on the notifications icon.
 * @param {string} [props.className=''] - Extra classes merged onto the root `nav` element.
 * @example
 * <AiNavRail activeView="conversation" onViewChange={(id) => {}} notificationCount={3} />
 */
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
