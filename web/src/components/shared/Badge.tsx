import { type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Text Badge – uses the alert-chip CSS from the local design system  */
/* ------------------------------------------------------------------ */

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'info';

export interface BadgeProps {
  /** Badge label or inner content */
  children?: ReactNode;
  /** Visual tone (semantic color) */
  variant?: BadgeVariant;
  /** Additional CSS class */
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: 'alert-chip-default',
  success: 'alert-chip-success',
  warning: 'alert-chip-warning',
  error: 'alert-chip-error',
  danger: 'alert-chip-error',
  info: 'alert-chip-info',
};

/**
 * Text pill badge for compact labels and status.
 * Built on the `alert-chip` CSS from the local Momentum design library.
 * @example
 * <Badge variant="success">Active</Badge>
 */
export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span className={`alert-chip ${VARIANT_CLASS[variant]} ${className}`}>
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
  /** Indicator presentation (dot, counter, icon, or validation state) */
  type: BadgeIndicatorType;
  /** Count value for 'counter' type */
  count?: number;
  /** Max count before showing "N+" (default 999) */
  maxCount?: number;
  /** Icon name for 'icon' type */
  icon?: IconName;
  /** Additional CSS class */
  className?: string;
  /** Accessible name override for the indicator */
  'aria-label'?: string;
}

const VALIDATION_ICONS: Record<string, IconName> = {
  success: 'check-circle',
  warning: 'warning',
  error: 'error-legacy',
};

/**
 * Small status marker: unread dot, numeric counter, custom icon, or validation glyph.
 * @example
 * <BadgeIndicator type="counter" count={3} />
 */
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
  /** Wrapped trigger or anchor element */
  children: ReactNode;
  /** Badge or indicator rendered in the overlay slot */
  badge: ReactNode;
  /** Additional CSS class on the wrapper */
  className?: string;
}

/**
 * Wraps content and positions a badge or indicator in the corner (e.g. on icons).
 * @example
 * <BadgeOverlay badge={<BadgeIndicator type="dot" />}><Icon name="chat" /></BadgeOverlay>
 */
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
