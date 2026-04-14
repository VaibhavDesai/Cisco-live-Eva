import Icon from './Icon'

/**
 * Namespaced toolbar building blocks: pill `ButtonGroup` containers, icon-only and
 * pill-shaped buttons, and a non-interactive divider. Compose as `Toolbar.ButtonGroup` etc.
 *
 * @example
 * <Toolbar.ButtonGroup size="compact">
 *   <Toolbar.IconButton icon="bold-bold" label="Bold" />
 * </Toolbar.ButtonGroup>
 */

/**
 * Thin vertical separator between adjacent controls inside a `ButtonGroup`.
 *
 * @example
 * <Toolbar.Divider />
 */
function Divider() {
  return (
    <span className="toolbar-divider" aria-hidden="true">
      <span className="toolbar-divider__line" />
    </span>
  )
}

/**
 * Icon-only toolbar button for use inside `Toolbar.ButtonGroup`.
 *
 * @param {Object} props
 * @param {string} props.icon Icon name passed to `<Icon>`.
 * @param {string} props.label Accessible name; sets `aria-label` on the `<button>`.
 * @param {number} [props.size] Icon size in px; defaults to `16`.
 * @param {boolean} [props.selected] When true, toggles pressed styling (`aria-pressed`); defaults to `false`.
 * @param {boolean} [props.disabled] Disables the control; defaults to `false`.
 * @param {() => void} [props.onClick] Click handler.
 * @param {string} [props.className] Extra class names on the button; defaults to `""`.
 * @example
 * <Toolbar.IconButton icon="bold-bold" label="Bold" selected={isBold} onClick={toggleBold} />
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
 * Icon + label toolbar button for use inside `Toolbar.ButtonGroup`; `children` override the visible label text.
 *
 * @param {Object} props
 * @param {string} [props.icon] Optional icon name shown before the label.
 * @param {string} [props.label] Default visible text when `children` is omitted.
 * @param {number} [props.iconSize] Icon size in px when `icon` is set; defaults to `16`.
 * @param {boolean} [props.selected] When true, toggles pressed styling (`aria-pressed`); defaults to `false`.
 * @param {boolean} [props.disabled] Disables the control; defaults to `false`.
 * @param {() => void} [props.onClick] Click handler.
 * @param {string} [props.className] Extra class names on the button; defaults to `""`.
 * @param {*} [props.children] If set, replaces `label` as button content.
 * @example
 * <Toolbar.PillButton icon="share-bold" label="Share" onClick={onShare} />
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
 * Pill-shaped group that lays out toolbar buttons; optionally inserts `Divider` elements between children.
 *
 * @param {Object} props
 * @param {'compact'|'standard'} [props.size] Group height preset (`compact` ≈ 24px, `standard` ≈ 32px); defaults to `'standard'`.
 * @param {'horizontal'|'vertical'} [props.orientation] Layout axis for `role="toolbar"`; defaults to `'horizontal'`.
 * @param {boolean} [props.autoDividers] When true, renders a divider between each child; defaults to `true`.
 * @param {*} [props.children] Typically `Toolbar.IconButton` / `Toolbar.PillButton` nodes.
 * @param {string} [props.className] Extra class names on the group wrapper; defaults to `""`.
 * @example
 * <Toolbar.ButtonGroup size="compact" orientation="horizontal">
 *   <Toolbar.IconButton icon="italic-bold" label="Italic" />
 * </Toolbar.ButtonGroup>
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
 * Default export: namespace object exposing `ButtonGroup`, `IconButton`, `PillButton`, and `Divider`
 * for dot-notation usage (`Toolbar.ButtonGroup`, …). Same constructors are also available as named exports.
 *
 * @example
 * <Toolbar.ButtonGroup>
 *   <Toolbar.IconButton icon="bold-bold" label="Bold" />
 *   <Toolbar.IconButton icon="italic-bold" label="Italic" />
 * </Toolbar.ButtonGroup>
 */
const Toolbar = {
  ButtonGroup,
  IconButton,
  PillButton,
  Divider,
}

export default Toolbar
export { ButtonGroup, IconButton, PillButton, Divider }
