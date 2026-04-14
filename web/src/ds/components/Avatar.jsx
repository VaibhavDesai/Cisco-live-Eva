import Icon from './Icon'

const SIZE_MAP = {
  'xx-small': 24,
  'x-small': 32,
  small: 48,
  midsize: 64,
  large: 72,
  'x-large': 88,
  'xx-large': 124,
}

const ICON_SIZE_MAP = {
  'xx-small': 14,
  'x-small': 20,
  small: 28,
  midsize: 40,
  large: 44,
  'x-large': 54,
  'xx-large': 76,
}

const PRESENCE_ICONS = {
  active: 'active-presence-small-filled',
  meet: 'camera-presence-filled',
  dnd: 'dnd-presence-filled',
  away: 'recents-presence-filled',
  ooo: 'pto-presence-filled',
  busy: 'busy-presence-bold',
  schedule: 'meetings-presence-filled',
}

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function Avatar({
  type = 'initials',
  size = 'x-small',
  src,
  alt = '',
  name,
  initials,
  icon,
  count,
  maxCount = 99,
  presence,
  disabled = false,
  ghost = false,
  interactive = false,
  onClick,
  className = '',
  ...rest
}) {
  const sizeClass = `avatar-${size}`
  const px = SIZE_MAP[size] || 32
  const iconPx = ICON_SIZE_MAP[size] || 20

  const classes = [
    'avatar',
    sizeClass,
    disabled && 'avatar-disabled',
    ghost && 'avatar-ghost',
    (interactive || onClick) && 'avatar-interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const displayInitials = initials || getInitials(name)
  const displayCount =
    count != null && count > maxCount ? `${maxCount}+` : String(count ?? '')

  const handleClick = () => {
    if (disabled) return
    onClick?.()
  }

  const avatarEl = (
    <div
      className={classes}
      role={interactive || onClick ? 'button' : undefined}
      tabIndex={interactive || onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
      aria-label={alt || name || undefined}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {type === 'photo' && src && (
        <img src={src} alt={alt || name || 'Avatar'} />
      )}
      {type === 'initials' && <span>{displayInitials}</span>}
      {type === 'icon' && (
        <span className="avatar-icon-inner">
          <Icon name={icon || 'placeholder-bold'} size={iconPx} />
        </span>
      )}
      {type === 'counter' && <span>{displayCount}</span>}
    </div>
  )

  if (!presence) return avatarEl

  const presenceColor = `avatar-presence-${presence}`
  const presenceIcon = PRESENCE_ICONS[presence]
  const presenceSize = Math.round(px * 0.28)

  return (
    <span className={`avatar-wrap avatar-wrap--${size}`}>
      {avatarEl}
      <span className={`avatar-presence ${presenceColor}`}>
        {presenceIcon && (
          <Icon name={presenceIcon} size={Math.max(presenceSize - 4, 8)} />
        )}
      </span>
    </span>
  )
}
