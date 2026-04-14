import { useState, useRef } from 'react'
import Icon from './Icon'

export default function PasswordInput({
  label = 'Password',
  placeholder = 'Placeholder text',
  helperText,
  validation = 'none',
  value,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef(null)

  const rootClasses = [
    'password-input',
    validation === 'error' && 'error',
    validation === 'success' && 'success',
    disabled && 'disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClasses}>
      {label && (
        <div className="password-input-label-row">
          <span className="password-input-label">{label}</span>
        </div>
      )}

      <div className="password-input-field">
        <input
          ref={inputRef}
          className="password-input-native"
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          {...rest}
        />
        <button
          className="password-input-toggle"
          type="button"
          tabIndex={-1}
          onClick={() => {
            setVisible((v) => !v)
            inputRef.current?.focus()
          }}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <Icon name={visible ? 'hide-bold' : 'show-bold'} size={16} />
        </button>
      </div>

      {helperText && (
        <div className="password-input-helper">
          {validation === 'error' && (
            <span className="password-input-helper-icon">
              <Icon name="error-legacy-bold" size={16} />
            </span>
          )}
          {validation === 'success' && (
            <span className="password-input-helper-icon">
              <Icon name="check-circle-bold" size={16} />
            </span>
          )}
          <span>{helperText}</span>
        </div>
      )}
    </div>
  )
}
