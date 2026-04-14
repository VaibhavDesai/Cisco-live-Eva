import { type ButtonHTMLAttributes } from 'react';

export interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the pill appears selected and is exposed as pressed to assistive tech. */
  selected?: boolean;
}

/**
 * WIP filter chip control (Figma `523-182039`, 180×60) with selection state and `aria-pressed`.
 *
 * @example
 * <FilterPill selected type="button">Active filters</FilterPill>
 */
export function FilterPill({
  selected = false,
  className = '',
  type = 'button',
  ...rest
}: FilterPillProps) {
  return (
    <button
      type={type}
      className={`filter-pill ${selected ? 'filter-pill--selected' : ''} ${className}`.trim()}
      aria-pressed={selected}
      {...rest}
    />
  );
}
