import { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons';
import type { IconName } from '../../icons/types';

type ValidationState = 'error' | 'warning' | 'success' | undefined;

const VALIDATION_ICON: Record<string, { name: IconName; color: string }> = {
  error:   { name: 'error-legacy' as IconName, color: 'var(--danger-color)' },
  warning: { name: 'warning'      as IconName, color: 'var(--warning-color)' },
  success: { name: 'check-circle' as IconName, color: 'var(--success-color)' },
};

export interface ComboBoxOption {
  /** Stable value submitted when this option is chosen */
  value: string;
  /** Human-readable label shown in the list and input when selected */
  label: string;
  /** When true, the option cannot be selected */
  disabled?: boolean;
}

export interface ComboBoxProps {
  /** Selectable values shown in the dropdown */
  options: ComboBoxOption[];
  /** Currently selected option value */
  value: string;
  /** Called when the user picks a new option */
  onChange: (value: string) => void;
  /** Called when the filter text changes while typing */
  onInputChange?: (query: string) => void;
  /** Placeholder shown when the input has no display value */
  placeholder?: string;
  /** Visible label above the field */
  label?: string;
  /** Shows a required indicator with the label */
  required?: boolean;
  /** Helper or validation text below the field */
  hint?: string;
  /** Visual validation state for the field */
  validation?: ValidationState;
  /** Disables opening the list and editing the input */
  disabled?: boolean;
  /** Prevents editing while keeping focus affordances */
  readOnly?: boolean;
  /** Extra CSS class on the root element */
  className?: string;
  /** Explicit id for the input; falls back to `useId` when omitted */
  id?: string;
}

/**
 * Filterable combobox with a portaled listbox, typeahead, and keyboard navigation.
 * @example
 * <ComboBox options={countries} value={country} onChange={setCountry} label="Country" />
 */
export default function ComboBox({
  options,
  value,
  onChange,
  onInputChange,
  placeholder = 'Select or type...',
  label,
  required = false,
  hint,
  validation,
  disabled = false,
  readOnly = false,
  className = '',
  id: externalId,
}: ComboBoxProps) {
  const autoId = useId();
  const inputId = externalId ?? autoId;
  const listboxId = `${inputId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(opt => opt.value === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const displayValue = isOpen ? query : selectedOption?.label ?? '';

  const open = useCallback(() => {
    if (disabled || readOnly) return;
    setIsOpen(true);
    setQuery(selectedOption?.label ?? '');
    const idx = filtered.findIndex(opt => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [disabled, readOnly, selectedOption, filtered, value]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const selectOption = useCallback(
    (optValue: string) => {
      onChange(optValue);
      close();
      inputRef.current?.focus();
    },
    [onChange, close],
  );

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onInputChange?.(val);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      open();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1 >= filtered.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 < 0 ? filtered.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex] && !filtered[highlightedIndex].disabled) {
          selectOption(filtered[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        inputRef.current?.focus();
        break;
    }
  };

  const rootCls = [
    'combobox',
    isOpen && 'open',
    validation,
    disabled && 'disabled',
    readOnly && 'readonly',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hintCls = ['form-hint', validation].filter(Boolean).join(' ');

  const listbox =
    isOpen &&
    createPortal(
      <div
        ref={menuRef}
        id={listboxId}
        className="combobox-listbox"
        role="listbox"
        aria-activedescendant={
          highlightedIndex >= 0 && filtered[highlightedIndex]
            ? `${inputId}-opt-${filtered[highlightedIndex].value}`
            : undefined
        }
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          minWidth: menuPos.width,
          zIndex: 9999,
        }}
      >
        {filtered.length === 0 ? (
          <div className="combobox-empty">No results found</div>
        ) : (
          filtered.map((option, index) => (
            <button
              key={option.value}
              id={`${inputId}-opt-${option.value}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={[
                'combobox-option',
                option.value === value && 'selected',
                option.disabled && 'disabled',
                index === highlightedIndex && 'highlighted',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !option.disabled && selectOption(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              disabled={option.disabled}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="combobox-option-check">
                  <Icon name="check" weight="bold" size="sm" />
                </span>
              )}
            </button>
          ))
        )}
      </div>,
      document.body,
    );

  return (
    <div ref={containerRef} className={rootCls}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="combobox-field">
        <div className="combobox-input-area">
          <input
            ref={inputRef}
            id={inputId}
            className="combobox-input"
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={open}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            readOnly={readOnly}
          />
          <div className="combobox-separator" />
        </div>
        <button
          type="button"
          className="combobox-trigger"
          onClick={() => (isOpen ? close() : open())}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Toggle dropdown"
        >
          <span className="combobox-chevron">
            <Icon name={'arrow-down' as IconName} weight="bold" size={16} />
          </span>
        </button>
      </div>

      {hint && (
        <span className={hintCls}>
          {validation && VALIDATION_ICON[validation] && (
            <Icon
              name={VALIDATION_ICON[validation].name}
              weight="bold"
              size={16}
              color={VALIDATION_ICON[validation].color}
            />
          )}
          {hint}
        </span>
      )}

      {listbox}
    </div>
  );
}
