import { type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Banner                                                              */
/* ------------------------------------------------------------------ */

/** Semantic tone controlling icon, colors, and banner styling */
export type BannerType = 'info' | 'warning' | 'success' | 'error';

export interface BannerAction {
  /** Visible button label */
  label: string;
  /** Invoked when the action is clicked */
  onClick: () => void;
  /** Button visual style in the banner action area */
  variant?: 'ghost' | 'outline';
}

export interface BannerProps {
  /** Banner tone (icon and color treatment) */
  type?: BannerType;
  /** Primary heading text */
  title: string;
  /** Supporting content below the title */
  subtitle?: ReactNode;
  /** Optional ghost or outline buttons */
  actions?: BannerAction[];
  /** When true, shows the dismiss control */
  dismissable?: boolean;
  /** Invoked when the dismiss control is clicked */
  onDismiss?: () => void;
  /** Extra classes merged onto the banner root */
  className?: string;
}

const TYPE_CONFIG: Record<BannerType, { icon: IconName; className: string }> = {
  info: { icon: 'info-circle', className: 'banner-info' },
  warning: { icon: 'warning', className: 'banner-warning' },
  success: { icon: 'check-circle', className: 'banner-success' },
  error: { icon: 'error-legacy', className: 'banner-error' },
};

/**
 * Inline status banner with icon, optional actions, and dismiss control.
 * @example
 * <Banner type="warning" title="Heads up" subtitle="Your trial ends soon." />
 */
export function Banner({
  type = 'info',
  title,
  subtitle,
  actions,
  dismissable = true,
  onDismiss,
  className = '',
}: BannerProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className={`banner ${config.className}${className ? ` ${className}` : ''}`}
      role="alert"
    >
      <div className="banner-content">
        <span className="banner-icon">
          <Icon name={config.icon} weight="bold" size={20} />
        </span>
        <div className="banner-text">
          <span className="banner-title">{title}</span>
          {subtitle && <span className="banner-subtitle">{subtitle}</span>}
        </div>
      </div>

      {actions && actions.length > 0 && (
        <div className="banner-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={
                action.variant === 'outline'
                  ? 'banner-action-outline'
                  : 'banner-action-ghost'
              }
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {dismissable && (
        <button
          type="button"
          className="banner-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss banner"
        >
          <Icon name="cancel" weight="bold" size={16} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Promotional Banner                                                  */
/* ------------------------------------------------------------------ */

export interface PromoBannerProps {
  /** Primary heading text */
  title: string;
  /** Supporting content below the title */
  subtitle?: ReactNode;
  /** Optional ghost or outline buttons */
  actions?: BannerAction[];
  /** Custom content in the left slot */
  leftSlot?: ReactNode;
  /** Custom content in the right slot */
  rightSlot?: ReactNode;
  /** When true, shows the dismiss control */
  dismissable?: boolean;
  /** Invoked when the dismiss control is clicked */
  onDismiss?: () => void;
  /** Extra classes merged onto the banner root */
  className?: string;
}

/**
 * Promotional banner with optional side slots, actions, and dismiss control.
 * @example
 * <PromoBanner title="Upgrade" actions={[{ label: 'Learn more', onClick: openPricing }]} />
 */
export function PromoBanner({
  title,
  subtitle,
  actions,
  leftSlot,
  rightSlot,
  dismissable = true,
  onDismiss,
  className = '',
}: PromoBannerProps) {
  return (
    <div className={`promo-banner${className ? ` ${className}` : ''}`} role="region">
      <div className="promo-banner-body">
        {leftSlot && <div className="promo-banner-slot">{leftSlot}</div>}
        <div className="promo-banner-content">
          <div className="promo-banner-text">
            <span className="promo-banner-title">{title}</span>
            {subtitle && <span className="promo-banner-subtitle">{subtitle}</span>}
          </div>
          {actions && actions.length > 0 && (
            <div className="promo-banner-actions">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={
                    action.variant === 'outline'
                      ? 'banner-action-outline'
                      : 'banner-action-ghost'
                  }
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {rightSlot && <div className="promo-banner-slot">{rightSlot}</div>}
      </div>
      {dismissable && (
        <div className="promo-banner-dismiss">
          <button
            type="button"
            className="banner-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss banner"
          >
            <Icon name="cancel" weight="bold" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
