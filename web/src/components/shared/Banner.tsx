import { type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Banner                                                              */
/* ------------------------------------------------------------------ */

export type BannerType = 'info' | 'warning' | 'success' | 'error';

export interface BannerAction {
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'outline';
}

export interface BannerProps {
  type?: BannerType;
  title: string;
  subtitle?: ReactNode;
  actions?: BannerAction[];
  dismissable?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const TYPE_CONFIG: Record<BannerType, { icon: IconName; className: string }> = {
  info: { icon: 'info-circle', className: 'banner-info' },
  warning: { icon: 'warning', className: 'banner-warning' },
  success: { icon: 'check-circle', className: 'banner-success' },
  error: { icon: 'error-legacy', className: 'banner-error' },
};

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
  title: string;
  subtitle?: ReactNode;
  actions?: BannerAction[];
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  dismissable?: boolean;
  onDismiss?: () => void;
  className?: string;
}

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
