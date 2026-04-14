import Icon from './Icon'

/**
 * Toolbar.Divider — thin separator between toolbar items.
 */
function Divider() {
  return (
    <span className="toolbar-divider" aria-hidden="true">
      <span className="toolbar-divider__line" />
    </span>
  )
}

/**
 * Toolbar.IconButton — icon-only button inside a ButtonGroup.
 */
function IconButton({
  icon,
  label,
  size = 16,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      className={`toolbar-icon-btn ${className}`}
      aria-label={label}
      aria-pressed={selected || undefined}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

/**
 * Toolbar.PillButton — icon + text label button inside a ButtonGroup.
 */
function PillButton({
  icon,
  label,
  iconSize = 16,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`toolbar-pill-btn ${className}`}
      aria-pressed={selected || undefined}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {icon && (
        <span className="toolbar-btn__icon">
          <Icon name={icon} size={iconSize} />
        </span>
      )}
      {children || label}
    </button>
  )
}

/**
 * ButtonGroup — pill-shaped container that groups toolbar buttons with dividers.
 *
 * @param {'compact'|'standard'} size — 24px or 32px height
 * @param {'horizontal'|'vertical'} orientation
 * @param {ReactNode} children — IconButton/PillButton elements (dividers auto-inserted)
 * @param {boolean} autoDividers — auto-insert dividers between children (default true)
 */
function ButtonGroup({
  size = 'standard',
  orientation = 'horizontal',
  autoDividers = true,
  children,
  className = '',
  ...rest
}) {
  const sizeClass = size === 'compact' ? 'toolbar-group--compact' : 'toolbar-group--standard'
  const orientClass = orientation === 'vertical' ? 'toolbar-group--vertical' : ''

  const classes = [
    'toolbar-group',
    sizeClass,
    orientClass,
    className,
  ].filter(Boolean).join(' ')

  const childArray = Array.isArray(children)
    ? children.filter(Boolean)
    : children ? [children] : []

  return (
    <div className={classes} role="toolbar" aria-orientation={orientation} {...rest}>
      {autoDividers
        ? childArray.map((child, i) => (
            <span key={i} className="toolbar-group__item" style={{ display: 'contents' }}>
              {child}
              {i < childArray.length - 1 && <Divider />}
            </span>
          ))
        : children
      }
    </div>
  )
}

/**
 * Toolbar — top-level namespace that exposes sub-components via dot notation.
 *
 * Usage:
 *   <Toolbar.ButtonGroup size="compact">
 *     <Toolbar.IconButton icon="bold-bold" label="Bold" />
 *     <Toolbar.IconButton icon="italic-bold" label="Italic" />
 *   </Toolbar.ButtonGroup>
 */
const Toolbar = {
  ButtonGroup,
  IconButton,
  PillButton,
  Divider,
}

export default Toolbar
export { ButtonGroup, IconButton, PillButton, Divider }
