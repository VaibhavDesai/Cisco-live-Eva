import Dropdown, { type DropdownOption } from './Dropdown';
import type { IconName } from '../../icons/types';

/**
 * Option shape for the {@link Filter} component.
 *
 * Mirrors {@link DropdownOption} with a slightly friendlier name for filter
 * usage and an explicit `count` slot for facet counts shown in the listbox.
 */
export interface FilterOption<T extends string = string> {
  /** Value passed to `onChange` when the option is selected. */
  value: T;
  /** Visible label in the trigger and listbox. */
  label: string;
  /** When true, the option cannot be selected. */
  disabled?: boolean;
  /** Muted count shown after the label (e.g., number of items matching the facet). */
  count?: number;
}

export interface FilterProps<T extends string = string> {
  /** Filter choices shown in the popover listbox. */
  options: FilterOption<T>[];
  /** Currently selected value. */
  value: T;
  /** Called with the new value when the user picks a different option. */
  onChange: (value: T) => void;
  /** Label rendered above the trigger. Omit to render without a label. */
  label?: string;
  /** Trigger text when no option matches `value`. */
  placeholder?: string;
  /** Helper text below the trigger. */
  hint?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Extra class on the root `form-group` wrapper. */
  className?: string;
  /** Trigger size variant. Defaults to `compact` — filters typically live in dense toolbars. */
  size?: 'default' | 'compact';
  /** Override the leading icon. Defaults to the Momentum `filter` glyph. */
  leadingIcon?: IconName;
}

/**
 * Figma-spec Filter control (WIP Momentum library, node `523:186254`).
 *
 * A labeled select with a leading filter icon and a list-box popover whose
 * options can show facet counts. Thin preset over the shared {@link Dropdown}
 * — single-select, keyboard-navigable, portaled menu — so it inherits all the
 * usual field states (rest, hover, pressed, focused, active rest, active focused).
 *
 * @example
 * <Filter
 *   value={type}
 *   onChange={setType}
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'unsupported', label: 'Unsupported type', count: 3 },
 *     { value: 'oversize', label: 'Oversize', count: 1 },
 *   ]}
 * />
 */
export function Filter<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'All',
  hint,
  disabled = false,
  className = '',
  size = 'compact',
  leadingIcon = 'filter',
}: FilterProps<T>) {
  return (
    <Dropdown
      options={options as DropdownOption[]}
      value={value}
      onChange={(next) => onChange(next as T)}
      label={label}
      placeholder={placeholder}
      hint={hint}
      disabled={disabled}
      className={className}
      size={size}
      leadingIcon={leadingIcon}
    />
  );
}

export default Filter;
