import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Icon from './Icon'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDate(date) {
  if (!date) return ''
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m} / ${d} / ${date.getFullYear()}`
}

export default function DatePicker({
  label = 'Label',
  required = false,
  helperText,
  validation = 'none',
  value,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder = 'mm / dd / yyyy',
  className = '',
}) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth())
  const containerRef = useRef(null)

  useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear())
      setViewMonth(value.getMonth())
    }
  }, [value])

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

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const selectDay = useCallback(
    (day) => {
      const d = new Date(viewYear, viewMonth, day)
      d.setHours(0, 0, 0, 0)
      onChange?.(d)
      setOpen(false)
    },
    [viewYear, viewMonth, onChange],
  )

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const prevDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)

  const cells = useMemo(() => {
    const arr = []
    for (let i = firstDay - 1; i >= 0; i--) {
      arr.push({ day: prevDays - i, outside: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, outside: false })
    }
    const remainder = 7 - (arr.length % 7)
    if (remainder < 7) {
      for (let i = 1; i <= remainder; i++) {
        arr.push({ day: i, outside: true })
      }
    }
    return arr
  }, [firstDay, daysInMonth, prevDays])

  const rootClasses = [
    'datepicker',
    open && 'open',
    validation === 'error' && 'error',
    disabled && 'disabled',
    readOnly && 'readonly',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClasses} ref={containerRef}>
      {label && (
        <div className="datepicker-label-row">
          <span className="datepicker-label">{label}</span>
          {required && <span className="datepicker-required">*</span>}
        </div>
      )}

      <div
        className="datepicker-field"
        role="group"
        aria-label={label || 'Date picker'}
        tabIndex={0}
        onClick={() => !disabled && !readOnly && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (disabled || readOnly) return
          if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        <span className={`datepicker-field-text${value ? '' : ' placeholder'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
        <span className="datepicker-field-btn" aria-hidden="true">
          <Icon name="calendar-month-bold" size={16} />
        </span>
      </div>

      {helperText && (
        <div className="datepicker-helper">
          {validation === 'error' && (
            <span className="datepicker-helper-icon">
              <Icon name="error-legacy-bold" size={16} />
            </span>
          )}
          <span>{helperText}</span>
        </div>
      )}

      {open && (
        <div className="datepicker-calendar" role="dialog" aria-label="Calendar">
          <div className="datepicker-cal-header">
            <span className="datepicker-cal-title">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="datepicker-cal-nav">
              <button
                className="datepicker-cal-nav-btn"
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <Icon name="arrow-left-bold" size={16} />
              </button>
              <button
                className="datepicker-cal-nav-btn"
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <Icon name="arrow-right-bold" size={16} />
              </button>
            </div>
          </div>

          <div className="datepicker-cal-weekdays">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="datepicker-cal-weekday">{wd}</span>
            ))}
          </div>

          <div className="datepicker-cal-days">
            {cells.map((cell, i) => {
              const cellDate = cell.outside
                ? null
                : new Date(viewYear, viewMonth, cell.day)
              const isToday = cellDate && isSameDay(cellDate, today)
              const isSelected = cellDate && value && isSameDay(cellDate, value)

              const dayClasses = [
                'datepicker-cal-day',
                cell.outside && 'outside',
                isToday && 'today',
                isSelected && 'selected',
              ].filter(Boolean).join(' ')

              return (
                <button
                  key={i}
                  className={dayClasses}
                  type="button"
                  disabled={cell.outside}
                  onClick={() => !cell.outside && selectDay(cell.day)}
                  tabIndex={cell.outside ? -1 : 0}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
