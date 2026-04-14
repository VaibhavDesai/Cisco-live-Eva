import Icon from './Icon'

export default function Toggle({
  checked = false,
  onChange,
  label,
  helperText,
  size = 'default',
  disabled = false,
  readOnly = false,
  className = '',
  ...rest
}) {
  const isCompact = size === 'compact'

  const handleChange = () => {
    if (disabled || readOnly) return
    onChange?.(!checked)
  }

  const classes = [
    'toggle',
    isCompact && 'toggle-compact',
    disabled && 'toggle-disabled',
    readOnly && 'toggle-readonly',
    className,
  ].filter(Boolean).join(' ')

  return (
    <label className={classes}>
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
      <span className="toggle-track">
        <span className="toggle-handle">
          {!isCompact && (
            <span className="toggle-handle-icon">
              <Icon name={checked ? 'check-bold' : 'cancel-bold'} size={12} />
            </span>
          )}
        </span>
      </span>
      {(label || helperText) && (
        <span className="toggle-label-area">
          {label && <span className="toggle-label">{label}</span>}
          {helperText && <span className="toggle-helper">{helperText}</span>}
        </span>
      )}
    </label>
  )
}
