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
  children: ReactNode;
  /** Secondary label text or array of strings (joined with bullet separators) */
  secondaryLabel?: ReactNode | string[];
  /** Tertiary label text or array of strings (joined with bullet separators) */
  tertiaryLabel?: ReactNode | string[];
  /** Slot for leading content (icon, avatar, checkbox, etc.) */
  leading?: ReactNode;
  /** Slot for trailing content (text, icon, badge, button, etc.) */
  trailing?: ReactNode;
  /** Selected / active state */
  active?: boolean;
  disabled?: boolean;
  /** 'inset' (rounded 8px) or 'full-width' (no radius) */
  variant?: ListItemVariant;
  /** Expanded content shown below the main row */
  expandedContent?: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
  role?: string;
  'aria-label'?: string;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  tabIndex?: number;
}

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
  header: string;
  subline?: string;
}

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
  children: ReactNode;
  /** Optional leading icon */
  leadingIcon?: IconName;
  /** Optional trailing icon */
  trailingIcon?: IconName;
  /** Trailing slot for custom content (button, icon, etc.) */
  trailing?: ReactNode;
  disabled?: boolean;
  variant?: ListItemVariant;
  className?: string;
}

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
  children: ReactNode;
  className?: string;
  role?: string;
  'aria-label'?: string;
}

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
