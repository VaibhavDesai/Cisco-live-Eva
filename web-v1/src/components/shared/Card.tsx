import React, { forwardRef } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ─── Card ────────────────────────────────────────────────────── */

export type CardVariant = 'border' | 'ghost';
export type CardLayout = 'vertical' | 'horizontal';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  layout?: CardLayout;
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

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
  src?: string;
  alt?: string;
}

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
  icon?: IconName;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

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
  icon?: IconName;
}

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
