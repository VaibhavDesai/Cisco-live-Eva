import Icon from './Icon'

const VALIDATION_ICONS = {
  success: 'check-circle-badge-filled',
  warning: 'warning-badge-filled',
  error: 'error-legacy-badge-filled',
}

const COLOR_CLASS_MAP = {
  accent: '',
  default: 'badge-indicator-default',
  success: 'badge-indicator-success',
  warning: 'badge-indicator-warning',
  error: 'badge-indicator-error',
}

export default function Badge({
  type = 'dot',
  count,
  icon,
  color = 'accent',
  maxCount = 999,
  className = '',
  ...rest
}) {
  const colorClass = COLOR_CLASS_MAP[color] || ''

  if (type === 'dot') {
    return (
      <span className={`badge-indicator badge-indicator-dot ${className}`} {...rest}>
        <span className="badge-indicator-inner">
          <Icon name="unread-filled" size={12} />
        </span>
      </span>
    )
  }

  if (type === 'counter') {
    const display =
      count != null && count > maxCount ? `${maxCount}+` : String(count ?? 0)
    return (
      <span
        className={`badge-indicator badge-indicator-counter ${className}`}
        {...rest}
      >
        {display}
      </span>
    )
  }

  if (type === 'icon') {
    const isTransparent = color === 'transparent'
    const bgClass = isTransparent
      ? 'badge-indicator-transparent'
      : colorClass

    return (
      <span className={`badge-indicator ${className}`} {...rest}>
        <span className={`badge-indicator-icon ${bgClass}`}>
          <span className="badge-indicator-inner-icon">
            <Icon name={icon || 'placeholder-bold'} size={12} />
          </span>
        </span>
      </span>
    )
  }

  if (type === 'success' || type === 'warning' || type === 'error') {
    const validationColor = COLOR_CLASS_MAP[type] || ''
    const validationIcon = VALIDATION_ICONS[type]

    return (
      <span
        className={`badge-indicator ${validationColor} ${className}`}
        {...rest}
      >
        <span className="badge-indicator-inner-icon">
          <Icon name={validationIcon} size={12} />
        </span>
      </span>
    )
  }

  return null
}

export function BadgeOverlay({ badge, children, className = '' }) {
  return (
    <span className={`badge-overlay-wrapper ${className}`}>
      {children}
      {badge}
    </span>
  )
}
