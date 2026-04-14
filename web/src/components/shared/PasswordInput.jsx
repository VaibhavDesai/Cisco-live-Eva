import { useState, useRef } from 'react'
import Icon from './Icon'

/**
 * Password field with show/hide toggle, optional helper text, and validation styling.
 * Any props not listed below are forwarded to the native `<input>`.
 *
 * @param {Object} props
 * @param {string} [props.label] Visible label; defaults to `"Password"`.
 * @param {string} [props.placeholder] Input placeholder; defaults to `"Placeholder text"`.
 * @param {string} [props.helperText] Optional helper or validation message below the field.
 * @param {'none'|'error'|'success'} [props.validation] Visual state for helper row; defaults to `'none'`.
 * @param {string} [props.value] Controlled input value.
 * @param {(value: string) => void} [props.onChange] Called with the next string when the value changes.
 * @param {boolean} [props.disabled] Disables input and toggle; defaults to `false`.
 * @param {string} [props.className] Extra class names on the root element; defaults to `""`.
 * @example
 * <PasswordInput label="Password" value={pwd} onChange={setPwd} validation="error" helperText="Too short" />
 */
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
