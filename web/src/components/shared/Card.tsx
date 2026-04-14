import React, { forwardRef } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ─── Card ────────────────────────────────────────────────────── */

export type CardVariant = 'border' | 'ghost';
export type CardLayout = 'vertical' | 'horizontal';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bordered surface or minimal ghost chrome */
  variant?: CardVariant;
  /** Vertical stack or horizontal media + body layout */
  layout?: CardLayout;
  /** Whole card acts as a button (keyboard and click) */
  clickable?: boolean;
  /** Selected visual state */
  selected?: boolean;
  /** Blocks interaction when the card is clickable */
  disabled?: boolean;
}

/**
 * Grouped content surface; compose with header, body, and footer slots.
 * @example
 * <Card>
 *   <CardHeader title="Project" />
 *   <CardBody>Description</CardBody>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'border',
      layout,
      clickable = false,
      selected = false,
      disabled = false,
      className = '',
      children,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const cls = [
      'card',
      variant === 'ghost' && 'card-ghost',
      layout === 'horizontal' && 'card-horizontal',
      layout === 'vertical' && 'card-vertical',
      clickable && 'card-clickable',
      selected && 'card-selected',
      disabled && 'card-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const interactiveProps = clickable
      ? {
          role: 'button' as const,
          tabIndex: disabled ? -1 : 0,
          onClick: disabled ? undefined : onClick,
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          },
        }
      : { onClick };

    return (
      <div ref={ref} className={cls} {...interactiveProps} {...rest}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

/* ─── CardImage ───────────────────────────────────────────────── */

export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL; when omitted, children render inside the frame */
  src?: string;
  /** Accessible description when `src` is set */
  alt?: string;
}

/**
 * Top media region; renders an `<img>` from `src` or custom `children`.
 * @example
 * <CardImage src="/cover.png" alt="Cover art" />
 */
export function CardImage({
  src,
  alt = '',
  className = '',
  children,
  style,
  ...rest
}: CardImageProps) {
  return (
    <div className={`card-image ${className}`} style={style} {...rest}>
      {src ? <img src={src} alt={alt} /> : children}
    </div>
  );
}

/* ─── CardBodyWrapper ────────────────────────────────────────── */

/**
 * Inner wrapper that aligns body sections within the card layout.
 * @example
 * <CardBodyWrapper>{sections}</CardBodyWrapper>
 */
export function CardBodyWrapper({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-body-wrapper ${className}`} {...rest}>
      {children}
    </div>
  );
}

/* ─── CardHeader ──────────────────────────────────────────────── */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading Momentum icon */
  icon?: IconName;
  /** Primary heading text */
  title?: string;
  /** Secondary line under the title */
  subtitle?: string;
  /** Trailing toolbar or controls */
  actions?: React.ReactNode;
}

/**
 * Preset header (icon, title, subtitle, actions) or fully custom `children`.
 * @example
 * <CardHeader title="Team" subtitle="12 members" icon="active-speaker" />
 */
export function CardHeader({
  icon,
  title,
  subtitle,
  actions,
  className = '',
  children,
  ...rest
}: CardHeaderProps) {
  if (children) {
    return (
      <div className={`card-header ${className}`} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div className={`card-header ${className}`} {...rest}>
      {icon && (
        <span className="card-header-icon">
          <Icon name={icon} weight="bold" size={24} />
        </span>
      )}
      {(title || subtitle) && (
        <div className="card-header-text">
          {title && <span className="card-title">{title}</span>}
          {subtitle && <span className="card-subtitle">{subtitle}</span>}
        </div>
      )}
      {actions && <div className="card-header-actions">{actions}</div>}
    </div>
  );
}

/* ─── CardTitle ───────────────────────────────────────────────── */

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Standalone card-styled heading when not using `CardHeader` presets.
 * @example
 * <CardTitle>Release notes</CardTitle>
 */
export function CardTitle({
  children,
  className = '',
  ...rest
}: CardTitleProps) {
  return (
    <h3 className={`card-title ${className}`} {...rest}>
      {children}
    </h3>
  );
}

/* ─── CardBody ────────────────────────────────────────────────── */

/**
 * Main textual or rich content area of the card.
 * @example
 * <CardBody>{details}</CardBody>
 */
export function CardBody({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-body ${className}`} {...rest}>
      {children}
    </div>
  );
}

/* ─── CardFooter ──────────────────────────────────────────────── */

/**
 * Bottom slot for actions, links, or metadata.
 * @example
 * <CardFooter><span>Updated today</span></CardFooter>
 */
export function CardFooter({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-footer ${className}`} {...rest}>
      {children}
    </div>
  );
}

/* ─── CardFooterLink ──────────────────────────────────────────── */

export interface CardFooterLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Trailing Momentum icon */
  icon?: IconName;
}

/**
 * Footer link styled for cards, with optional trailing icon.
 * @example
 * <CardFooterLink href="/more" icon="arrow-right">View all</CardFooterLink>
 */
export function CardFooterLink({
  icon,
  children,
  className = '',
  ...rest
}: CardFooterLinkProps) {
  return (
    <a className={`card-footer-link ${className}`} {...rest}>
      {children}
      {icon && <Icon name={icon} weight="regular" size={16} />}
    </a>
  );
}

export default Card;
