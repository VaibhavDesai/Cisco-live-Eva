/**
 * Momentum Pill Button — maps to Figma "Simple Buttons / Pill Button"
 *
 * Variants: primary | secondary | tertiary
 * Sizes:    40 (default) | 32 | 28 | 24
 * Validation: default | positive | negative | accent
 */

function Button({
  children,
  variant = 'primary',
  size = 40,
  validation,
  leadingIcon,
  trailingIcon,
  disabled = false,
  className = '',
  ...rest
}) {
  const sizeClass = size !== 40 ? `btn-${size}` : ''
  const variantClass = `btn-${variant}`
  const validationClass = validation ? `btn-${validation}` : ''

  const classes = [
    'btn',
    variantClass,
    validationClass,
    sizeClass,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {leadingIcon && <span className="btn-icon">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="btn-icon">{trailingIcon}</span>}
    </button>
  )
}

export default Button
