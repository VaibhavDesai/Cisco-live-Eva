import { type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Text Badge (backward-compatible)                                   */
/* ------------------------------------------------------------------ */

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'info';

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantClass = variant ? `badge-${variant}` : '';

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge Indicator Types                                              */
/* ------------------------------------------------------------------ */

export type BadgeIndicatorType =
  | 'dot'
  | 'counter'
  | 'icon'
  | 'success'
  | 'warning'
  | 'error';

export interface BadgeIndicatorProps {
  type: BadgeIndicatorType;
  /** Count value for 'counter' type */
  count?: number;
  /** Max count before showing "N+" (default 999) */
  maxCount?: number;
  /** Icon name for 'icon' type */
  icon?: IconName;
  className?: string;
  'aria-label'?: string;
}

const VALIDATION_ICONS: Record<string, IconName> = {
  success: 'check-circle',
  warning: 'warning',
  error: 'error-legacy',
};

export function BadgeIndicator({
  type,
  count = 0,
  maxCount = 999,
  icon,
  className = '',
  'aria-label': ariaLabel,
}: BadgeIndicatorProps) {
  const baseCls = 'badge-indicator';

  const typeCls = {
    dot: 'badge-indicator-dot',
    counter: 'badge-indicator-counter',
    icon: 'badge-indicator-icon',
    success: 'badge-indicator-success',
    warning: 'badge-indicator-warning',
    error: 'badge-indicator-error',
  }[type];

  const cls = [baseCls, typeCls, className].filter(Boolean).join(' ');

  const label =
    ariaLabel ??
    (type === 'dot'
      ? 'New notification'
      : type === 'counter'
        ? `${count} notifications`
        : type);

  if (type === 'dot') {
    return (
      <span className={cls} aria-label={label} role="status">
        <span className="badge-indicator-dot-inner" />
      </span>
    );
  }

  if (type === 'counter') {
    const displayCount = count > maxCount ? `${maxCount}+` : String(count);
    return (
      <span className={cls} aria-label={label} role="status">
        {displayCount}
      </span>
    );
  }

  if (type === 'icon') {
    return (
      <span className={cls} aria-label={label} role="status">
        <span className="badge-indicator-inner-icon">
          {icon && <Icon name={icon} weight="bold" size={12} />}
        </span>
      </span>
    );
  }

  const validationIcon = VALIDATION_ICONS[type];
  return (
    <span className={cls} aria-label={label} role="status">
      <Icon name={validationIcon} weight="bold" size={12} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge Overlay Wrapper                                              */
/* ------------------------------------------------------------------ */

export interface BadgeOverlayProps {
  children: ReactNode;
  badge: ReactNode;
  className?: string;
}

export function BadgeOverlay({
  children,
  badge,
  className = '',
}: BadgeOverlayProps) {
  return (
    <span className={`badge-overlay-wrapper${className ? ` ${className}` : ''}`}>
      {children}
      {badge}
    </span>
  );
}
