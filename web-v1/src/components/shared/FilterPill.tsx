import { type ButtonHTMLAttributes } from 'react';

export interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * WIP Filter control (`523-182039`) — 180×60 chip with selection.
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
