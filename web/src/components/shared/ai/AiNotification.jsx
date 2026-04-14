import Icon from '../Icon'

/**
 * Renders a single AI assistant notification row with optional badge, body, action buttons,
 * timestamp, unread indicator, and an overflow menu trigger.
 *
 * @param {Object} props
 * @param {string} props.title Notification heading text.
 * @param {string} [props.body] Optional supporting description below the title.
 * @param {string} [props.time] Optional time label shown on the right.
 * @param {boolean} [props.read=false] When true, applies read styling and hides the unread dot.
 * @param {'warning'|'error'|'info'|'success'|string|false} [props.badge='warning'] Badge variant key for the leading icon; falsy hides the badge.
 * @param {Array<{ label: string, onClick?: function(): void, variant?: string }>} [props.actions=[]] Inline action buttons; first defaults to primary styling unless overridden.
 * @param {function(): void} [props.onMore] When set, shows a “more” control that calls this without toggling the row click.
 * @param {function(): void} [props.onClick] Handler for clicking the notification surface (keyboard-accessible button role).
 * @param {boolean} [props.showDivider=true] When true, renders a top divider (e.g. between stacked items).
 * @param {string} [props.className=''] Additional CSS class names merged onto the root element.
 * @example
 * <AiNotification title="Policy updated" body="Review the draft." time="2m" onClick={() => {}} />
 */
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
