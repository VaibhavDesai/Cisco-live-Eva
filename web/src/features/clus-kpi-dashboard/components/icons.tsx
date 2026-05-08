import { Icon } from '../momentum';

/** Small UI affordances: always use Momentum *-bold icons at 16px. */
export function SearchIcon() {
  return (
    <Icon
      name="search-bold"
      size={16}
      lengthUnit="px"
      className="text-[var(--mds-color-theme-text-secondary-normal)]"
      aria-hidden
    />
  );
}

export function FilterIcon() {
  return (
    <Icon
      name="filter-bold"
      size={16}
      lengthUnit="px"
      className="text-[var(--mds-color-theme-text-secondary-normal)]"
      aria-hidden
    />
  );
}

export function ArrowDownIcon() {
  return (
    <Icon name="arrow-down-bold" size={16} lengthUnit="px" className="text-[var(--mds-color-theme-text-secondary-normal)]" aria-hidden />
  );
}
