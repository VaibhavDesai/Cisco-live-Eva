import { useState, useRef, useCallback } from 'react'

/**
 * Search field with leading icon, optional filter chips, and a clear control;
 * built on the `form-input-wrapper` pattern with controlled or uncontrolled value.
 * Any props not listed below are forwarded to the native `<input>`.
 *
 * @param {Object} props
 * @param {string} [props.label] Optional label text above the input.
 * @param {string} [props.placeholder] Placeholder when there are no chips; defaults to `"Search"`.
 * @param {string} [props.value] Controlled input value.
 * @param {string} [props.defaultValue] Uncontrolled initial value; defaults to `""`.
 * @param {(value: string) => void} [props.onChange] Called with the next string when the input changes.
 * @param {() => void} [props.onClear] Called when the clear button is clicked (after value is cleared).
 * @param {Array<{ label: string, value: string }>} [props.filters] Chips rendered inside the field; defaults to `[]`.
 * @param {(filter: { label: string, value: string }) => void} [props.onRemoveFilter] Called when a chip's close control is clicked.
 * @param {boolean} [props.disabled] Disables the field and its controls; defaults to `false`.
 * @param {string} [props.className] Additional class names on the outer `form-group` wrapper; defaults to `""`.
 * @example
 * <SearchField placeholder="Search projects" value={q} onChange={setQ} />
 */
function SearchField({
  label,
  placeholder = 'Search',
  value: controlledValue,
  defaultValue = '',
  onChange,
  onClear,
  filters = [],
  onRemoveFilter,
  disabled = false,
  className = '',
  ...rest
}) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const inputRef = useRef(null)

  const value = isControlled ? controlledValue : internalValue

  const handleChange = useCallback((e) => {
    const next = e.target.value
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }, [isControlled, onChange])

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('')
    onChange?.('')
    onClear?.()
    inputRef.current?.focus()
  }, [isControlled, onChange, onClear])

  const showClear = value.length > 0 || filters.length > 0
  const hasFilters = filters.length > 0

  const wrapperClasses = [
    'form-input-wrapper',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label className="form-label">{label}</label>}
      <div className={wrapperClasses}>
        <span className="form-input-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        {hasFilters && filters.map((filter) => (
          <span className="search-filter-chip" key={`${filter.label}:${filter.value}`}>
            <span className="search-filter-chip-text">
              {filter.label}: {filter.value}
            </span>
            <button
              type="button"
              className="search-filter-chip-close"
              aria-label={`Remove filter ${filter.label}`}
              onClick={() => onRemoveFilter?.(filter)}
              disabled={disabled}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M7.5 2.5L2.5 7.5M2.5 2.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder={hasFilters ? '' : placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={label || placeholder}
          {...rest}
        />

        {showClear && (
          <button
            type="button"
            className="form-input-clear"
            aria-label="Clear search"
            onClick={handleClear}
            disabled={disabled}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchField
