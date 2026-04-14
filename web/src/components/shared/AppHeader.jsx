import { useState, useCallback } from 'react'
import Icon from './Icon'
import AiSymbol from './ai/AiSymbol'
import Avatar from './Avatar'
import { BadgeIndicator, BadgeOverlay } from './Badge'
import SearchField from './SearchField'

/**
 * Application header with brand, optional search, AI and utility actions, app launcher, and avatar.
 * Desktop shows middle (search or custom) and trailing controls; mobile uses a compact leading layout.
 *
 * @param {Object} props
 * @param {'desktop'|'mobile'} [props.type='desktop'] — layout variant (`mobile` omits middle and trailing desktop chrome)
 * @param {string} [props.productName='Product Name'] — visible product name when `wordmarkSvg` is not set
 * @param {string} [props.wordmarkSvg] — image URL used as a CSS mask for the wordmark
 * @param {string} [props.wordmarkAlt='Webex'] — accessible label for the masked wordmark
 * @param {boolean} [props.fixed=false] — when true, applies fixed header positioning styles
 * @param {boolean} [props.showSearch=true] — show the search field in the middle when `centerContent` is not provided (desktop)
 * @param {string} [props.searchPlaceholder='Search'] — placeholder text for the search field
 * @param {function(string): void} [props.onSearch] — invoked with the current search string when it changes
 * @param {function(): void} [props.onMenuClick] — leading menu (hamburger) button handler
 * @param {boolean} [props.showAiButton=true] — show the AI assistant control in the trailing area (desktop)
 * @param {function(): void} [props.onAiClick] — AI assistant button handler
 * @param {*} [props.centerContent] — custom middle content; when set, replaces the default search (desktop)
 * @param {Object[]} [props.utilityIcons] — trailing icon buttons; items use `key`, `icon`, `label`, optional `onClick`, optional `badgeCount` (defaults to built-in feedback/help)
 * @param {number} [props.alertCount=0] — when positive, wraps the alerts icon with a counter badge
 * @param {boolean} [props.showWaffleMenu=true] — show the app launcher (waffle) control (desktop)
 * @param {string} [props.avatarSrc] — avatar image URL for the user control
 * @param {string} [props.avatarName] — display name used for initials when no photo
 * @param {function(): void} [props.onAvatarClick] — when provided, avatar is interactive
 * @param {string} [props.className=''] — additional class names for the root `<header>`
 * @param {*} [props.children] — optional nodes rendered in the trailing area before waffle and avatar (desktop)
 * @param {Object} [props.rest] — additional props spread onto the root `<header>`
 * @example
 * <AppHeader productName="Agent Studio" onMenuClick={() => {}} />
 * <AppHeader type="mobile" showSearch={false} centerContent={<span>Title</span>} />
 */
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
        <BadgeOverlay key={item.key} badge={<BadgeIndicator type="counter" count={item.badgeCount} />}>
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
              <BadgeOverlay badge={<BadgeIndicator type="counter" count={alertCount} />}>
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
