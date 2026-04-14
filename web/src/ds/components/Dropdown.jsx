import { useState, useRef, useEffect, useCallback, useId } from 'react'
import Icon from './Icon'

/**
 * Dropdown / Select — Foundational select component.
 *
 * Based on the Momentum Select Figma component (same .Core - Input / .Base - Text Field
 * base as the text input). Uses .form-input-wrapper CSS for the trigger to ensure
 * visual consistency with all form inputs.
 *
 * @param {Array}    options      — [{ value, label, icon?, disabled?, destructive? }]
 * @param {string}   value        — currently selected value
 * @param {function} onChange     — (newValue) => void
 * @param {string}   [placeholder] — shown when no value selected
 * @param {string}   [label]      — visible label rendered above the trigger
 * @param {boolean}  [required]   — shows required indicator on label
 * @param {string}   [helperText] — helper text below the trigger
 * @param {string}   [validation] — 'error' | 'warning' | 'success' | undefined
 * @param {boolean}  [disabled]
 * @param {string}   [className]
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  label,
  required = false,
  helperText,
  validation,
  disabled = false,
  className = '',
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const triggerId = useId()
  const listId = useId()

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder
  const isPlaceholder = !selected

  const close = useCallback(() => {
    setOpen(false)
    setHighlighted(-1)
  }, [])

  const toggle = useCallback(() => {
    if (disabled) return
    setOpen((prev) => {
      if (!prev) {
        const idx = options.findIndex((o) => o.value === value)
        setHighlighted(idx >= 0 ? idx : 0)
      }
      return !prev
    })
  }, [disabled, options, value])

  const select = useCallback(
    (opt) => {
      if (opt.disabled) return
      onChange?.(opt.value)
      close()
    },
    [onChange, close],
  )

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close()
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, close])

  useEffect(() => {
    if (!open || highlighted < 0) return
    const item = listRef.current?.children[highlighted]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [open, highlighted])

  const onTriggerKeyDown = (e) => {
    if (disabled) return
    const findEnabled = (startIdx, direction) => {
      let idx = startIdx
      while (idx >= 0 && idx < options.length) {
        if (!options[idx].disabled) return idx
        idx += direction
      }
      return -1
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'Down': {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          const idx = options.findIndex((o) => o.value === value)
          setHighlighted(idx >= 0 ? idx : findEnabled(0, 1))
        } else {
          setHighlighted((prev) => {
            const next = findEnabled(prev + 1, 1)
            return next >= 0 ? next : prev
          })
        }
        break
      }
      case 'ArrowUp':
      case 'Up': {
        e.preventDefault()
        if (open) {
          setHighlighted((prev) => {
            const next = findEnabled(prev - 1, -1)
            return next >= 0 ? next : prev
          })
        }
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (open && highlighted >= 0 && !options[highlighted]?.disabled) {
          select(options[highlighted])
        } else if (!open) {
          toggle()
        }
        break
      }
      case 'Home': {
        if (open) {
          e.preventDefault()
          setHighlighted(findEnabled(0, 1))
        }
        break
      }
      case 'End': {
        if (open) {
          e.preventDefault()
          setHighlighted(findEnabled(options.length - 1, -1))
        }
        break
      }
      default:
        break
    }
  }

  const triggerClass = [
    'form-input-wrapper',
    open && 'open',
    validation,
    disabled && 'disabled',
  ]
    .filter(Boolean)
    .join(' ')

  const rootClass = [
    'dropdown',
    validation,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={rootClass} {...rest}>
      {label && (
        <label className="dropdown__label" htmlFor={triggerId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <button
        id={triggerId}
        type="button"
        className={triggerClass}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
      >
        <span
          className="dropdown-trigger-value"
          style={isPlaceholder ? { color: 'var(--text-secondary)' } : undefined}
        >
          {displayLabel}
        </span>
        <span className="dropdown-trigger-chevron" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <Icon name={open ? 'arrow-up-bold' : 'arrow-down-bold'} size={16} />
        </span>
      </button>

      {helperText && (
        <p className="dropdown__helper">{helperText}</p>
      )}

      {open && (
        <div
          ref={listRef}
          id={listId}
          className="dropdown-menu"
          role="listbox"
          aria-labelledby={triggerId}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 50,
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isHighlighted = i === highlighted
            const itemClass = [
              'dropdown-item',
              isSelected && 'selected',
              isHighlighted && 'highlighted',
              opt.disabled && 'disabled',
              opt.destructive && 'destructive',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={itemClass}
                onClick={() => select(opt)}
                onMouseEnter={() => setHighlighted(i)}
              >
                {opt.icon && (
                  <span className="dropdown-icon">
                    <Icon name={opt.icon} size={16} />
                  </span>
                )}
                <span className="dropdown-label">{opt.label}</span>
                {isSelected && (
                  <span className="dropdown-check">
                    <Icon name="check-bold" size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
