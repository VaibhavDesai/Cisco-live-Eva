import { useState, useCallback } from 'react'
import Icon from './Icon'
import AiSymbol from './AiSymbol'
import Avatar from './Avatar'
import Badge, { BadgeOverlay } from './Badge'
import SearchField from './SearchField'

const DEFAULT_UTILITY_ICONS = [
  { key: 'feedback', icon: 'announcement-bold', label: 'Feedback' },
  { key: 'help', icon: 'help-circle-bold', label: 'Help' },
]

export default function AppHeader({
  type = 'desktop',
  productName = 'Product Name',
  wordmarkSvg,
  wordmarkAlt = 'Webex',
  fixed = false,
  showSearch = true,
  searchPlaceholder = 'Search',
  onSearch,
  onMenuClick,
  showAiButton = true,
  onAiClick,
  centerContent,
  utilityIcons = DEFAULT_UTILITY_ICONS,
  alertCount = 0,
  showWaffleMenu = true,
  avatarSrc,
  avatarName,
  onAvatarClick,
  className = '',
  children,
  ...rest
}) {
  const [searchVal, setSearchVal] = useState('')
  const isMobile = type === 'mobile'
  const isDesktop = !isMobile

  const handleSearch = useCallback((val) => {
    setSearchVal(val)
    onSearch?.(val)
  }, [onSearch])

  const classes = [
    'app-header',
    isMobile && 'app-header--mobile',
    fixed && 'app-header--fixed',
    className,
  ].filter(Boolean).join(' ')

  const renderUtilityButton = (item) => {
    const btn = (
      <button
        type="button"
        className="app-header__icon-btn"
        aria-label={item.label}
        onClick={item.onClick}
      >
        <Icon name={item.icon} size={24} />
      </button>
    )
    if (item.badgeCount > 0) {
      return (
        <BadgeOverlay key={item.key} badge={<Badge type="counter" count={item.badgeCount} />}>
          {btn}
        </BadgeOverlay>
      )
    }
    return <span key={item.key}>{btn}</span>
  }

  const alertButton = (
    <button
      type="button"
      className="app-header__icon-btn"
      aria-label="Alerts"
    >
      <Icon name="alert-bold" size={24} />
    </button>
  )

  return (
    <header className={classes} role="banner" {...rest}>
      {/* ── Leading: menu + wordmark ── */}
      <div className="app-header__leading">
        <div className="app-header__brand">
          <button
            type="button"
            className="app-header__icon-btn"
            aria-label="Menu"
            onClick={onMenuClick}
          >
            <Icon name="list-menu-bold" size={24} />
          </button>
          <div className="app-header__wordmark">
            {wordmarkSvg ? (
              <span
                role="img"
                aria-label={wordmarkAlt}
                className="app-header__wordmark-logo"
                style={{ WebkitMaskImage: `url(${wordmarkSvg})`, maskImage: `url(${wordmarkSvg})` }}
              />
            ) : (
              <span className="app-header__product-name">{productName}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Middle: center content or search field (desktop only) ── */}
      {isDesktop && (centerContent || showSearch) && (
        <div className="app-header__middle">
          {centerContent || (
            <div className="app-header__search">
              <SearchField
                placeholder={searchPlaceholder}
                value={searchVal}
                onChange={handleSearch}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Trailing: product buttons + utility buttons + waffle + avatar ── */}
      {isDesktop && (
        <div className="app-header__trailing">
          {showAiButton && (
            <div className="app-header__btn-group">
              <button
                type="button"
                className="app-header__icon-btn"
                aria-label="AI Assistant"
                onClick={onAiClick}
              >
                <AiSymbol size={24} />
              </button>
              <div className="app-header__divider" />
            </div>
          )}

          <div className="app-header__btn-group">
            {utilityIcons.map(renderUtilityButton)}

            {alertCount > 0 ? (
              <BadgeOverlay badge={<Badge type="counter" count={alertCount} />}>
                {alertButton}
              </BadgeOverlay>
            ) : (
              alertButton
            )}

            <div className="app-header__divider" />
          </div>

          {children}

          {showWaffleMenu && (
            <button
              type="button"
              className="app-header__icon-btn"
              aria-label="App Launcher"
            >
              <Icon name="waffle-menu-bold" size={24} />
            </button>
          )}

          <div className="app-header__avatar">
            <Avatar
              type={avatarSrc ? 'photo' : 'initials'}
              size="x-small"
              src={avatarSrc}
              name={avatarName || 'User'}
              interactive={!!onAvatarClick}
              onClick={onAvatarClick}
            />
          </div>
        </div>
      )}
    </header>
  )
}
