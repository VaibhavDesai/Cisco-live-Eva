import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons';
import type { IconName } from '../../icons/types';

export interface DropdownOption {
  /** Value passed to `onChange` when this option is selected */
  value: string;
  /** Visible label in the menu and trigger */
  label: string;
  /** When true, the option cannot be selected */
  disabled?: boolean;
  /** Optional muted count rendered after the label in the menu (e.g., filter facets) */
  count?: number;
}

interface DropdownProps {
  /** Optional id for the trigger. A stable id is generated when omitted. */
  id?: string;
  /** Choices shown in the listbox */
  options: DropdownOption[];
  /** Currently selected option value */
  value: string;
  /** Called with the new value when selection changes */
  onChange: (value: string) => void;
  /** Trigger text when no option matches `value` */
  placeholder?: string;
  /** Optional label rendered above the trigger */
  label?: string;
  /** Shows a required indicator with the label */
  required?: boolean;
  /** Helper text below the trigger */
  hint?: string;
  /** Disables opening the menu and changing the value */
  disabled?: boolean;
  /** Extra class on the root `form-group` wrapper */
  className?: string;
  /** Trigger size variant */
  size?: 'default' | 'compact';
  /** Optional leading icon rendered inside the trigger (e.g., `filter`). */
  leadingIcon?: IconName;
  /** Direction the menu opens from the trigger. */
  menuPlacement?: 'bottom' | 'top';
}

/**
 * Single-select dropdown with a portal menu, typeahead-friendly keyboard navigation, and field chrome.
 *
 * @example
 * <Dropdown options={[{ value: 'a', label: 'A' }]} value={v} onChange={setV} label="Choose" />
 */
export default function Dropdown({
  id: externalId,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  required = false,
  hint,
  disabled = false,
  className = '',
  size = 'default',
  leadingIcon,
  menuPlacement = 'bottom',
}: DropdownProps) {
  const autoId = useId();
  const triggerId = externalId ?? `${autoId}-trigger`;
  const labelId = `${triggerId}-label`;
  const valueId = `${triggerId}-value`;
  const hintId = `${triggerId}-hint`;
  const menuId = `${triggerId}-menu`;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: menuPlacement === 'top' ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, menuPlacement]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => (prev + 1 >= options.length ? 0 : prev + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev - 1 < 0 ? options.length - 1 : prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex]?.disabled) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
      }
    },
    [isOpen, highlightedIndex, options, onChange],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen) {
      const selectedIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const menu =
    isOpen &&
    createPortal(
      <div
        id={menuId}
        ref={menuRef}
        className="dropdown-menu"
        role="listbox"
        aria-labelledby={label ? labelId : undefined}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${menuId}-option-${highlightedIndex}` : undefined
        }
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: menuPosition.width,
          transform: menuPlacement === 'top' ? 'translateY(-100%)' : undefined,
          zIndex: 9999,
        }}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            id={`${menuId}-option-${index}`}
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={[
              'dropdown-item',
              option.value === value && 'selected',
              option.disabled && 'disabled',
              index === highlightedIndex && 'highlighted',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => !option.disabled && handleSelect(option.value)}
            onMouseEnter={() => setHighlightedIndex(index)}
            disabled={option.disabled}
          >
            <span className="dropdown-label">{option.label}</span>
            {typeof option.count === 'number' && (
              <span className="dropdown-option-count">{option.count}</span>
            )}
            {option.value === value && (
              <span className="dropdown-check">
                <Icon name="check" weight="bold" size="sm" />
              </span>
            )}
          </button>
        ))}
      </div>,
      document.body,
    );

  return (
    <div ref={containerRef} className={`form-group ${className}`}>
      {label && (
        <label id={labelId} className="form-label" htmlFor={triggerId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        className={`dropdown-trigger${size === 'compact' ? ' dropdown-trigger--compact' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : valueId}
        aria-describedby={hint ? hintId : undefined}
      >
        {leadingIcon && (
          <span className="dropdown-trigger-leading" aria-hidden="true">
            <Icon name={leadingIcon} weight="bold" size="xs" />
          </span>
        )}
        <span id={valueId} className={`dropdown-trigger-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="dropdown-trigger-chevron">
          <Icon name="arrow-down" weight="bold" size="xs" />
        </span>
      </button>
      {hint && <span id={hintId} className="form-hint">{hint}</span>}
      {menu}
    </div>
  );
}
