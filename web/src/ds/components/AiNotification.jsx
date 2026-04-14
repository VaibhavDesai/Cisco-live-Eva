import Icon from './Icon'

function AiNotification({
  title,
  body,
  time,
  read = false,
  badge = 'warning',
  actions = [],
  onMore,
  onClick,
  showDivider = true,
  className = '',
}) {
  const rootClasses = [
    'ai-notif-item',
    read && 'ai-notif-item--read',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const badgeIconMap = {
    warning: 'warning-badge-filled',
    error: 'error-badge-filled',
    info: 'info-circle-bold',
    success: 'check-circle-bold',
  }

  return (
    <div className={rootClasses} onClick={onClick} role="button" tabIndex={0}>
      {showDivider && <div className="ai-notif-item__divider" />}

      <div className="ai-notif-item__left">
        <div className="ai-notif-item__header">
          {badge && (
            <span className={`ai-notif-item__badge ai-notif-item__badge--${badge}`}>
              <Icon name={badgeIconMap[badge] || 'warning-badge-filled'} size={12} />
            </span>
          )}
          <div className="ai-notif-item__title-wrap">
            <span className="ai-notif-item__title">{title}</span>
          </div>
        </div>

        {body && (
          <div className="ai-notif-item__body-wrap">
            <p className="ai-notif-item__body">{body}</p>
          </div>
        )}

        {actions.length > 0 && (
          <div className="ai-notif-item__actions">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                className={`ai-notif-item__action-btn ai-notif-item__action-btn--${action.variant || (i === 0 ? 'primary' : 'secondary')}`}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick?.()
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ai-notif-item__right">
        <div className="ai-notif-item__time-row">
          {time && <span className="ai-notif-item__time">{time}</span>}
          {!read && <span className="ai-notif-item__unread-dot" />}
        </div>
        {onMore && (
          <button
            type="button"
            className="ai-notif-item__more-btn"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation()
              onMore?.()
            }}
          >
            <Icon name="more-bold" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AiNotification
