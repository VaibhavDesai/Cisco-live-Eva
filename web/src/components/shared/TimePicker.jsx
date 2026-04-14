import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Icon from './Icon'

function generateTimeOptions(interval = 30, use12hr = true) {
  const options = []
  for (let m = 0; m < 24 * 60; m += interval) {
    const h24 = Math.floor(m / 60)
    const min = m % 60
    if (use12hr) {
      const period = h24 < 12 ? 'AM' : 'PM'
      const h12 = h24 % 12 || 12
      options.push({
        label: `${h12}:${String(min).padStart(2, '0')} ${period}`,
        hour: h24,
        minute: min,
      })
    } else {
      options.push({
        label: `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
        hour: h24,
        minute: min,
      })
    }
  }
  return options
}

function pad2(n) {
  return n != null ? String(n).padStart(2, '0') : ''
}

/**
 * Time picker with spin inputs, optional AM/PM, dropdown list of stepped times,
 * keyboard support, and optional helper/validation row.
 *
 * @param {Object} props
 * @param {string} [props.label] Visible label; defaults to `"Label"`.
 * @param {boolean} [props.required] When true, shows a required indicator next to the label; defaults to `false`.
 * @param {string} [props.helperText] Optional text below the field (e.g. validation hint).
 * @param {'none'|'error'} [props.validation] When `'error'`, shows error styling/icon in the helper row; defaults to `'none'`.
 * @param {boolean} [props.use12hr] Use 12-hour clock and AM/PM control; defaults to `true`.
 * @param {number} [props.interval] Minutes between generated list options; defaults to `30`.
 * @param {{ hour: number, minute: number }|null|undefined} [props.value] Selected time as 24-hour `hour` and `minute`.
 * @param {(value: { hour: number, minute: number }) => void} [props.onChange] Called when the user selects or edits a time.
 * @param {boolean} [props.disabled] Disables interaction; defaults to `false`.
 * @param {boolean} [props.readOnly] Prevents editing while keeping focus styling; defaults to `false`.
 * @param {string} [props.className] Extra class names on the root element; defaults to `""`.
 * @example
 * <TimePicker label="Start" value={{ hour: 9, minute: 30 }} onChange={setStart} use12hr />
 */
export default function TimePicker({
  label = 'Label',
  required = false,
  helperText,
  validation = 'none',
  use12hr = true,
  interval = 30,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const hourRef = useRef(null)
  const minRef = useRef(null)
  const periodRef = useRef(null)

  const hour = value?.hour
  const minute = value?.minute
  const period = hour != null ? (hour < 12 ? 'AM' : 'PM') : null

  const displayHour = hour != null
    ? (use12hr ? String(hour % 12 || 12) : pad2(hour))
    : ''
  const displayMin = minute != null ? pad2(minute) : ''

  const options = useMemo(
    () => generateTimeOptions(interval, use12hr),
    [interval, use12hr],
  )

  const selectedLabel = hour != null && minute != null
    ? options.find((o) => o.hour === hour && o.minute === minute)?.label
    : null

  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  useEffect(() => {
    if (open && listRef.current && selectedLabel) {
      const idx = options.findIndex((o) => o.label === selectedLabel)
      if (idx >= 0) {
        setFocusedIndex(idx)
        const el = listRef.current.children[idx]
        if (el) el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [open, selectedLabel, options])

  const selectOption = useCallback(
    (opt) => {
      onChange?.({ hour: opt.hour, minute: opt.minute })
      setOpen(false)
    },
    [onChange],
  )

  const handleHourBlur = useCallback(
    (e) => {
      const raw = parseInt(e.target.value, 10)
      if (isNaN(raw)) return
      const max = use12hr ? 12 : 23
      const clamped = Math.max(use12hr ? 1 : 0, Math.min(raw, max))
      let h24 = clamped
      if (use12hr) {
        const isPM = period === 'PM'
        if (clamped === 12) h24 = isPM ? 12 : 0
        else h24 = isPM ? clamped + 12 : clamped
      }
      onChange?.({ hour: h24, minute: minute ?? 0 })
    },
    [use12hr, period, minute, onChange],
  )

  const handleMinBlur = useCallback(
    (e) => {
      const raw = parseInt(e.target.value, 10)
      if (isNaN(raw)) return
      const clamped = Math.max(0, Math.min(raw, 59))
      onChange?.({ hour: hour ?? 0, minute: clamped })
    },
    [hour, onChange],
  )

  const cyclePeriod = useCallback(() => {
    if (hour == null) return
    const newHour = hour < 12 ? hour + 12 : hour - 12
    onChange?.({ hour: newHour, minute: minute ?? 0 })
  }, [hour, minute, onChange])

  const handleFieldKeyDown = useCallback(
    (e) => {
      if (disabled || readOnly) return
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [disabled, readOnly],
  )

  const handleListKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (focusedIndex >= 0) selectOption(options[focusedIndex])
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [focusedIndex, options, selectOption],
  )

  useEffect(() => {
    if (open && listRef.current && focusedIndex >= 0) {
      const el = listRef.current.children[focusedIndex]
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex, open])

  const rootClasses = [
    'timepicker',
    open && 'open',
    validation === 'error' && 'error',
    disabled && 'disabled',
    readOnly && 'readonly',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClasses} ref={containerRef}>
      {label && (
        <div className="timepicker-label-row">
          <span className="timepicker-label">{label}</span>
          {required && <span className="timepicker-required">*</span>}
        </div>
      )}

      <div
        className="timepicker-field"
        role="group"
        aria-label={label || 'Time picker'}
        onKeyDown={handleFieldKeyDown}
      >
        <div className="timepicker-spingroup">
          <div className="timepicker-hrmin">
            <input
              ref={hourRef}
              className="timepicker-spin"
              type="text"
              inputMode="numeric"
              placeholder={use12hr ? 'hh' : 'HH'}
              maxLength={2}
              value={displayHour}
              onChange={() => {}}
              onBlur={handleHourBlur}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              readOnly={readOnly}
              aria-label="Hours"
            />
            <span className="timepicker-colon">:</span>
            <input
              ref={minRef}
              className="timepicker-spin"
              type="text"
              inputMode="numeric"
              placeholder="mm"
              maxLength={2}
              value={displayMin}
              onChange={() => {}}
              onBlur={handleMinBlur}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              readOnly={readOnly}
              aria-label="Minutes"
            />
          </div>
          {use12hr && (
            <button
              ref={periodRef}
              className="timepicker-period"
              type="button"
              onClick={cyclePeriod}
              disabled={disabled || readOnly}
              aria-label="Toggle AM/PM"
            >
              {period ?? '--'}
            </button>
          )}
        </div>

        <button
          className="timepicker-chevron"
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && !readOnly && setOpen((o) => !o)}
          aria-label={open ? 'Close time list' : 'Open time list'}
          disabled={disabled}
        >
          <Icon name="arrow-down-bold" size={16} />
        </button>
      </div>

      {helperText && (
        <div className="timepicker-helper">
          {validation === 'error' && (
            <span className="timepicker-helper-icon">
              <Icon name="error-legacy-bold" size={16} />
            </span>
          )}
          <span>{helperText}</span>
        </div>
      )}

      {open && (
        <div
          ref={listRef}
          className="timepicker-listbox"
          role="listbox"
          aria-label="Time options"
          tabIndex={0}
          onKeyDown={handleListKeyDown}
        >
          {options.map((opt, i) => (
            <div
              key={opt.label}
              className={`timepicker-option${opt.label === selectedLabel ? ' selected' : ''}${i === focusedIndex ? ' focused' : ''}`}
              role="option"
              aria-selected={opt.label === selectedLabel}
              onClick={() => selectOption(opt)}
            >
              <span>{opt.label}</span>
              {opt.label === selectedLabel && (
                <span className="timepicker-option-check">
                  <Icon name="check-bold" size={20} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
