import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import Icon from './Icon'

const SideNavContext = createContext({ collapsed: false })

function useSideNav() {
  return useContext(SideNavContext)
}

/**
 * SideNav — Momentum side navigation shell.
 *
 * @param {boolean} collapsed — 72px icon-only mode
 */
function SideNav({ collapsed = false, children, className = '', ...rest }) {
  const classes = [
    'sidenav',
    collapsed && 'sidenav--collapsed',
    className,
  ].filter(Boolean).join(' ')

  return (
    <SideNavContext.Provider value={{ collapsed }}>
      <nav className={classes} aria-label="Side navigation" {...rest}>
        {children}
      </nav>
    </SideNavContext.Provider>
  )
}

function Upper({ children, className = '', ...rest }) {
  return (
    <div className={`sidenav__upper ${className}`} {...rest}>
      <div className="sidenav__nav">
        {children}
      </div>
    </div>
  )
}

function Footer({ children, className = '', ...rest }) {
  return (
    <div className={`sidenav__lower ${className}`} {...rest}>
      {children}
    </div>
  )
}

function Section({ header, divider, children, className = '', ...rest }) {
  const showDivider = divider !== undefined ? divider : !!header

  return (
    <div className={`sidenav__section ${className}`} {...rest}>
      {showDivider && <Divider />}
      {header && <div className="sidenav__section-header">{header}</div>}
      {children}
    </div>
  )
}

function Divider({ className = '' }) {
  return (
    <div className={`sidenav__divider ${className}`} aria-hidden="true">
      <div className="sidenav__divider-line" />
    </div>
  )
}

/**
 * SideNav.Item — single navigation item with marker, icon, label, badge, arrow.
 * When `children` are provided alongside `hasChildren`, clicking opens a fly-out popover.
 *
 * @param {string} icon — Momentum icon name
 * @param {string} label — text label
 * @param {boolean} active
 * @param {boolean} disabled
 * @param {number} badge — counter badge value
 * @param {boolean} hasChildren — shows right arrow chevron
 * @param {ReactNode} children — fly-out sub-menu items (SideNav.SubMenuItem)
 * @param {function} onClick
 */
function Item({
  icon,
  label,
  active = false,
  disabled = false,
  badge,
  hasChildren = false,
  onClick,
  children,
  className = '',
  ...rest
}) {
  const { collapsed } = useSideNav()
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 })
  const itemRef = useRef(null)
  const flyoutRef = useRef(null)

  const hasFlyout = hasChildren && children

  const updateFlyoutPos = useCallback(() => {
    if (!itemRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    let top = rect.top
    let left = rect.right + 4
    if (flyoutRef.current) {
      const fh = flyoutRef.current.offsetHeight
      if (top + fh > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - fh - 8)
      }
    }
    setFlyoutPos({ top, left })
  }, [])

  const handleClick = useCallback(() => {
    if (disabled) return
    if (hasFlyout) {
      setFlyoutOpen((prev) => !prev)
    } else {
      onClick?.()
    }
  }, [disabled, hasFlyout, onClick])

  useEffect(() => {
    if (!flyoutOpen) return
    updateFlyoutPos()
    function handleOutside(e) {
      if (
        itemRef.current && !itemRef.current.contains(e.target) &&
        flyoutRef.current && !flyoutRef.current.contains(e.target)
      ) {
        setFlyoutOpen(false)
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setFlyoutOpen(false)
    }
    function handleScrollResize() {
      updateFlyoutPos()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('scroll', handleScrollResize, true)
    window.addEventListener('resize', handleScrollResize)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('scroll', handleScrollResize, true)
      window.removeEventListener('resize', handleScrollResize)
    }
  }, [flyoutOpen, updateFlyoutPos])

  const tabClasses = [
    'sidenav__tab',
    active && 'sidenav__tab--active',
    disabled && 'sidenav__tab--disabled',
  ].filter(Boolean).join(' ')

  return (
    <div className={`sidenav__item ${className}`} ref={itemRef} {...rest}>
      <div className="sidenav__marker">
        {active && <div className="sidenav__marker-pip" />}
      </div>
      <button
        type="button"
        className={tabClasses}
        onClick={handleClick}
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
        aria-expanded={hasFlyout ? flyoutOpen : undefined}
        aria-haspopup={hasFlyout ? 'true' : undefined}
        title={collapsed ? label : undefined}
      >
        {icon && (
          <span className="sidenav__tab-icon">
            <Icon name={icon} size={24} />
          </span>
        )}
        <span className="sidenav__tab-label">{label}</span>
        {badge != null && (
          <span className="sidenav__tab-badge">{badge}</span>
        )}
        {hasChildren && (
          <span className="sidenav__tab-arrow">
            <Icon name="arrow-right-bold" size={16} />
          </span>
        )}
      </button>
      {flyoutOpen && hasFlyout && (
        <div
          className="sidenav__flyout"
          role="menu"
          ref={flyoutRef}
          style={{ top: flyoutPos.top, left: flyoutPos.left }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * SideNav.SubMenuItem — a single item inside a fly-out popover.
 *
 * @param {string} icon — Momentum icon name (20px)
 * @param {string} label — text label
 * @param {function} onClick
 */
function SubMenuItem({ icon, label, onClick, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`sidenav__flyout-item ${className}`}
      role="menuitem"
      onClick={onClick}
      {...rest}
    >
      {icon && (
        <span className="sidenav__flyout-item-icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="sidenav__flyout-item-label">{label}</span>
    </button>
  )
}

function CustomerLogo({
  icon = 'company-bold',
  name = 'Customer Name',
  onClick,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`sidenav__customer ${className}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      {...rest}
    >
      <span className="sidenav__customer-icon">
        <Icon name={icon} size={24} />
      </span>
      <span className="sidenav__customer-name">{name}</span>
    </div>
  )
}

SideNav.Upper = Upper
SideNav.Footer = Footer
SideNav.Section = Section
SideNav.Divider = Divider
SideNav.Item = Item
SideNav.SubMenuItem = SubMenuItem
SideNav.CustomerLogo = CustomerLogo

export default SideNav
