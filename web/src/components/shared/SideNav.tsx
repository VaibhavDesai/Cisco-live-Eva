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
/*  SideNav (root container)                                           */
/* ------------------------------------------------------------------ */

export interface SideNavProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function SideNav({
  children,
  className = '',
  'aria-label': ariaLabel,
}: SideNavProps) {
  return (
    <nav
      className={`sidenav${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  SideNavUpper — scrollable area for main items                      */
/* ------------------------------------------------------------------ */

export interface SideNavUpperProps {
  children: ReactNode;
  className?: string;
}

export function SideNavUpper({ children, className = '' }: SideNavUpperProps) {
  return (
    <div className={`sidenav-upper${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SideNavLower — fixed area at bottom                                */
/* ------------------------------------------------------------------ */

export interface SideNavLowerProps {
  children: ReactNode;
  className?: string;
}

export function SideNavLower({ children, className = '' }: SideNavLowerProps) {
  return (
    <div className={`sidenav-lower${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SideNavSection                                                     */
/* ------------------------------------------------------------------ */

export interface SideNavSectionProps {
  children: ReactNode;
  header?: string;
  showDivider?: boolean;
  className?: string;
}

export function SideNavSection({
  children,
  header,
  showDivider = false,
  className = '',
}: SideNavSectionProps) {
  return (
    <div className={`sidenav-section${className ? ` ${className}` : ''}`}>
      {showDivider && <div className="sidenav-divider" />}
      {header && <div className="sidenav-section-header">{header}</div>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SideNavDivider — standalone gradient divider                       */
/* ------------------------------------------------------------------ */

export function SideNavDivider() {
  return <div className="sidenav-divider" />;
}

/* ------------------------------------------------------------------ */
/*  SideNavItem                                                        */
/* ------------------------------------------------------------------ */

export interface SideNavItemProps {
  children: ReactNode;
  icon?: IconName;
  active?: boolean;
  disabled?: boolean;
  /** Show trailing arrow icon (for expandable items) */
  hasChildren?: boolean;
  /** Controls arrow rotation when expanded */
  expanded?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

export const SideNavItem = forwardRef<HTMLButtonElement, SideNavItemProps>(
  function SideNavItem(
    {
      children,
      icon,
      active = false,
      disabled = false,
      hasChildren = false,
      expanded = false,
      onClick,
      className = '',
      'aria-label': ariaLabel,
      'aria-expanded': ariaExpanded,
    },
    ref,
  ) {
    const itemCls = [
      'sidenav-item',
      active && 'active',
      disabled && 'disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        onClick?.(e);
      },
      [disabled, onClick],
    );

    return (
      <div className={itemCls}>
        <div className="sidenav-marker">
          <div className="sidenav-marker-dot" />
        </div>
        <button
          ref={ref}
          type="button"
          className="sidenav-tab"
          onClick={handleClick}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={
            ariaExpanded ?? (hasChildren ? expanded : undefined)
          }
          tabIndex={disabled ? -1 : 0}
        >
          {icon && (
            <span className="sidenav-tab-icon">
              <Icon name={icon} weight="bold" size={24} />
            </span>
          )}
          <span className="sidenav-tab-label">{children}</span>
          {hasChildren && (
            <span
              className={`sidenav-tab-trailing${expanded ? ' expanded' : ''}`}
            >
              <Icon name="arrow-right" weight="bold" size={16} />
            </span>
          )}
        </button>
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  SideNavSubMenu — container for nested sub-items                    */
/* ------------------------------------------------------------------ */

export interface SideNavSubMenuProps {
  children: ReactNode;
  className?: string;
}

export function SideNavSubMenu({
  children,
  className = '',
}: SideNavSubMenuProps) {
  return (
    <div className={`sidenav-submenu${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SideNavSubMenuItem                                                 */
/* ------------------------------------------------------------------ */

export interface SideNavSubMenuItemProps {
  children: ReactNode;
  icon?: IconName;
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  'aria-label'?: string;
}

export const SideNavSubMenuItem = forwardRef<
  HTMLButtonElement,
  SideNavSubMenuItemProps
>(function SideNavSubMenuItem(
  {
    children,
    icon,
    active = false,
    disabled = false,
    onClick,
    className = '',
    'aria-label': ariaLabel,
  },
  ref,
) {
  const cls = [
    'sidenav-submenu-item',
    active && 'active',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
    },
    [disabled, onClick],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
      }
    },
    [disabled, onClick],
  );

  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      tabIndex={disabled ? -1 : 0}
    >
      {icon && (
        <span className="sidenav-submenu-item-icon">
          <Icon name={icon} weight="bold" size={20} />
        </span>
      )}
      <span className="sidenav-submenu-item-label">{children}</span>
    </button>
  );
});

export default SideNav;
