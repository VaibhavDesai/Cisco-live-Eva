import { useState } from 'react'
import AiNotification from './AiNotification'

function AiNotifications({
  notifications = [],
  onDismiss,
  onAction,
  onMore,
  className = '',
}) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  return (
    <div className={`ai-notifications ${className}`}>
      <div className="ai-notifications__header">
        <span className="ai-notifications__title">AI Notifications</span>
        <div className="ai-notifications__tabs">
          <button
            type="button"
            className={`ai-notifications__tab${filter === 'all' ? ' ai-notifications__tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`ai-notifications__tab${filter === 'unread' ? ' ai-notifications__tab--active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>
      <div className="ai-notifications__list">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
            No notifications
          </div>
        )}
        {filtered.map((n, i) => (
          <AiNotification
            key={n.id}
            title={n.title}
            body={n.description}
            time={n.time}
            read={n.read}
            badge={n.badge || 'warning'}
            actions={n.actions || []}
            showDivider={i > 0}
            onClick={() => onAction?.(n.id)}
            onMore={onMore ? () => onMore(n.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default AiNotifications
