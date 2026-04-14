import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import Icon from './Icon'

/**
 * Momentum-style side navigation shell: supplies collapse state via context and composes
 * `Upper`, `Footer`, `Section`, `Divider`, `Item`, `SubMenuItem`, and `CustomerLogo` subcomponents.
 *
 * @param {Object} props
 * @param {boolean} [props.collapsed=false] — when true, uses the collapsed (icon-focused) rail layout
 * @param {*} [props.children] — nested side nav regions and controls
 * @param {string} [props.className=''] — additional class names on the root `<nav>`
 * @param {Object} [props.rest] — additional props spread onto the root `<nav>`
 * @example
 * <SideNav>
 *   <SideNav.Upper><SideNav.Item icon="home-bold" label="Home" active /></SideNav.Upper>
 * </SideNav>
 */
const SideNavContext = createContext({ collapsed: false })

function useSideNav() {
  return useContext(SideNavContext)
}

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

/**
 * Upper region of the side nav wrapping the primary scrollable list (`sidenav__nav`).
 *
 * @param {Object} props
 * @param {*} [props.children] — main navigation items and related content
 * @param {string} [props.className=''] — additional class names on the outer container
 * @param {Object} [props.rest] — additional props spread onto the outer container
 * @example
 * <SideNav.Upper><SideNav.Item icon="home-bold" label="Home" /></SideNav.Upper>
 */
function Upper({ children, className = '', ...rest }) {
  return (
    <div className={`sidenav__upper ${className}`} {...rest}>
      <div className="sidenav__nav">
        {children}
      </div>
    </div>
  )
}

/**
 * Footer (lower) region of the side nav for secondary actions or meta content.
 *
 * @param {Object} props
 * @param {*} [props.children] — footer content such as utilities or profile shortcuts
 * @param {string} [props.className=''] — additional class names on the lower container
 * @param {Object} [props.rest] — additional props spread onto the lower container
 * @example
 * <SideNav.Footer><SideNav.CustomerLogo /></SideNav.Footer>
 */
function Footer({ children, className = '', ...rest }) {
  return (
    <div className={`sidenav__lower ${className}`} {...rest}>
      {children}
    </div>
  )
}

/**
 * Grouped block with optional section header and divider line for organizing nav content.
 *
 * @param {Object} props
 * @param {*} [props.header] — heading node rendered above the section body when provided
 * @param {boolean} [props.divider] — when defined, controls divider visibility; otherwise derived from `header`
 * @param {*} [props.children] — section body content
 * @param {string} [props.className=''] — additional class names on the section wrapper
 * @param {Object} [props.rest] — additional props spread onto the section wrapper
 * @example
 * <SideNav.Section header="Favorites"><SideNav.Item icon="star-bold" label="Starred" /></SideNav.Section>
 */
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

/**
 * Horizontal divider line used between side nav groups (purely visual, `aria-hidden`).
 *
 * @param {Object} props
 * @param {string} [props.className=''] — additional class names on the divider wrapper
 * @example
 * <SideNav.Divider />
 */
function Divider({ className = '' }) {
  return (
    <div className={`sidenav__divider ${className}`} aria-hidden="true">
      <div className="sidenav__divider-line" />
    </div>
  )
}

/**
 * Single primary nav row with active marker, optional icon, label, counter badge, and optional fly-out.
 * When `hasChildren` is true and `children` are provided, clicking toggles a positioned fly-out menu.
 *
 * @param {Object} props
 * @param {string} [props.icon] — Momentum icon name rendered at 24px in the row
 * @param {string} props.label — visible text label for the item
 * @param {boolean} [props.active=false] — current-page styling and `aria-current="page"` when true
 * @param {boolean} [props.disabled=false] — disables interaction and dims the row when true
 * @param {number} [props.badge] — optional numeric badge shown beside the label
 * @param {boolean} [props.hasChildren=false] — shows a chevron and enables fly-out when `children` exist
 * @param {function(): void} [props.onClick] — invoked on activate when there is no fly-out content
 * @param {*} [props.children] — fly-out menu content (typically `SideNav.SubMenuItem` nodes)
 * @param {string} [props.className=''] — additional class names on the item wrapper
 * @param {Object} [props.rest] — additional props spread onto the item wrapper
 * @example
 * <SideNav.Item icon="folder-bold" label="Projects" hasChildren><SideNav.SubMenuItem label="A" /></SideNav.Item>
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
 * Row inside an `Item` fly-out menu (`role="menuitem"`), with optional leading icon at 20px.
 *
 * @param {Object} props
 * @param {string} [props.icon] — Momentum icon name for the fly-out row
 * @param {string} props.label — visible label text
 * @param {function(): void} [props.onClick] — click handler for the menu row
 * @param {string} [props.className=''] — additional class names on the `<button>`
 * @param {Object} [props.rest] — additional props spread onto the `<button>`
 * @example
 * <SideNav.SubMenuItem icon="document-bold" label="Drafts" onClick={() => {}} />
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

/**
 * Customer or tenant branding row with icon and name, keyboard-activatable like a button.
 *
 * @param {Object} props
 * @param {string} [props.icon='company-bold'] — Momentum icon name for the logo slot
 * @param {string} [props.name='Customer Name'] — display name beside the icon
 * @param {function(): void} [props.onClick] — invoked on click or Enter/Space when focused
 * @param {string} [props.className=''] — additional class names on the branding container
 * @param {Object} [props.rest] — additional props spread onto the branding container
 * @example
 * <SideNav.CustomerLogo name="Acme Corp" onClick={() => {}} />
 */
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
