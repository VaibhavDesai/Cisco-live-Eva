import {
  forwardRef,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ListItemVariant = 'inset' | 'full-width';

/* ------------------------------------------------------------------ */
/*  Bullet Separator                                                   */
/* ------------------------------------------------------------------ */

function BulletSeparator() {
  return <span className="listitem-separator" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  ListItem                                                           */
/* ------------------------------------------------------------------ */

export interface ListItemProps {
  /** Primary row content (title) */
  children: ReactNode;
  /** Secondary line; string arrays render with bullet separators */
  secondaryLabel?: ReactNode | string[];
  /** Tertiary line; string arrays render with bullet separators */
  tertiaryLabel?: ReactNode | string[];
  /** Leading slot (icon, avatar, checkbox, etc.) */
  leading?: ReactNode;
  /** Trailing slot (text, icon, badge, button, etc.) */
  trailing?: ReactNode;
  /** Highlights the row as selected or active */
  active?: boolean;
  /** Disables interaction and dims the row */
  disabled?: boolean;
  /** Layout: inset (rounded) or edge-to-edge full-width */
  variant?: ListItemVariant;
  /** Optional body rendered below the main row when expanded */
  expandedContent?: ReactNode;
  /** Invoked on click (also Enter/Space when focusable) */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Extra CSS class on the root */
  className?: string;
  /** WAI-ARIA role override */
  role?: string;
  /** Accessible name when the row is interactive */
  'aria-label'?: string;
  /** Selection state for listbox-style patterns */
  'aria-selected'?: boolean;
  /** Disabled state exposed to assistive technologies */
  'aria-disabled'?: boolean;
  /** Tab order; defaults when `onClick` is provided */
  tabIndex?: number;
}

/**
 * Styled list row with optional leading/trailing slots, metadata lines, and expansion.
 * @example
 * <ListItem leading={<Icon name="meetings" />} onClick={open}>
 *   Team standup
 * </ListItem>
 */
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem(
    {
      children,
      secondaryLabel,
      tertiaryLabel,
      leading,
      trailing,
      active = false,
      disabled = false,
      variant = 'inset',
      expandedContent,
      onClick,
      className = '',
      role: roleProp,
      'aria-label': ariaLabel,
      'aria-selected': ariaSelected,
      'aria-disabled': ariaDisabled,
      tabIndex,
    },
    ref,
  ) {
    const rootCls = [
      'listitem',
      variant === 'full-width' && 'full-width',
      active && 'active',
      disabled && 'disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        onClick?.(e);
      },
      [disabled, onClick],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e as unknown as MouseEvent<HTMLDivElement>);
        }
      },
      [disabled, onClick],
    );

    return (
      <div
        ref={ref}
        className={rootCls}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={tabIndex ?? (onClick && !disabled ? 0 : undefined)}
        role={roleProp ?? (onClick ? 'button' : undefined)}
        aria-label={ariaLabel}
        aria-selected={ariaSelected}
        aria-disabled={disabled || ariaDisabled || undefined}
      >
        <div className="listitem-content">
          {leading && <div className="listitem-leading">{leading}</div>}

          <div className="listitem-body">
            <span className="listitem-primary">{children}</span>
            {secondaryLabel && (
              <LabelRow className="listitem-secondary" value={secondaryLabel} />
            )}
            {tertiaryLabel && (
              <LabelRow className="listitem-tertiary" value={tertiaryLabel} />
            )}
          </div>

          {trailing && <div className="listitem-trailing">{trailing}</div>}
        </div>

        {expandedContent && (
          <div className="listitem-expanded">{expandedContent}</div>
        )}
      </div>
    );
  },
);

function LabelRow({
  className,
  value,
}: {
  className: string;
  value: ReactNode | string[];
}) {
  if (Array.isArray(value)) {
    return (
      <span className={className}>
        {value.map((segment, i) => (
          <span key={i}>
            {i > 0 && <BulletSeparator />}
            <span>{segment}</span>
          </span>
        ))}
      </span>
    );
  }
  return <span className={className}>{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  ListItemTrailingCopy — convenience for trailing header + subline   */
/* ------------------------------------------------------------------ */

export interface ListItemTrailingCopyProps {
  /** Primary trailing label */
  header: string;
  /** Optional secondary line under the header */
  subline?: string;
}

/**
 * Trailing column preset with a header line and optional subline.
 * @example
 * <ListItem trailing={<ListItemTrailingCopy header="5:00 PM" subline="Today" />} />
 */
export function ListItemTrailingCopy({
  header,
  subline,
}: ListItemTrailingCopyProps) {
  return (
    <div className="listitem-trailing-copy">
      <span className="listitem-trailing-header">{header}</span>
      {subline && (
        <span className="listitem-trailing-subline">{subline}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ListHeader                                                         */
/* ------------------------------------------------------------------ */

export interface ListHeaderProps {
  /** Section title text */
  children: ReactNode;
  /** Optional leading Momentum icon */
  leadingIcon?: IconName;
  /** Optional trailing Momentum icon */
  trailingIcon?: IconName;
  /** Trailing slot for custom content (button, menu trigger, etc.) */
  trailing?: ReactNode;
  /** Disables header styling/interaction affordances */
  disabled?: boolean;
  /** Matches list row inset or full-width layout */
  variant?: ListItemVariant;
  /** Extra CSS class on the root */
  className?: string;
}

/**
 * Sticky-style section header for grouped list content.
 * @example
 * <ListHeader leadingIcon="meetings">Meetings</ListHeader>
 */
export function ListHeader({
  children,
  leadingIcon,
  trailingIcon,
  trailing,
  disabled = false,
  variant = 'inset',
  className = '',
}: ListHeaderProps) {
  const rootCls = [
    'list-header',
    variant === 'full-width' && 'full-width',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootCls}>
      <div className="list-header-content">
        {leadingIcon && (
          <Icon name={leadingIcon} weight="bold" size={16} />
        )}
        <span className="list-header-label">{children}</span>
        {trailing && (
          <div className="list-header-trailing">{trailing}</div>
        )}
        {trailingIcon && (
          <Icon name={trailingIcon} weight="bold" size={16} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List (container)                                                   */
/* ------------------------------------------------------------------ */

export interface ListProps {
  /** List rows or grouped sections */
  children: ReactNode;
  /** Extra CSS class on the container */
  className?: string;
  /** Landmark role; defaults to `list` */
  role?: string;
  /** Accessible name for the list region */
  'aria-label'?: string;
}

/**
 * Scrollable list container with list semantics.
 * @example
 * <List aria-label="Threads">{rows}</List>
 */
export function List({
  children,
  className = '',
  role: roleProp = 'list',
  'aria-label': ariaLabel,
}: ListProps) {
  return (
    <div
      className={`list-container${className ? ` ${className}` : ''}`}
      role={roleProp}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export default ListItem;
