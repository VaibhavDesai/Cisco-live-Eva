import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  forwardRef,
} from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

export type TextLinkVariant = 'standalone' | 'inline';
export type TextLinkSize = 'sm' | 'md' | 'lg';

export interface TextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Link label or rich content */
  children: ReactNode;
  /** Block standalone link vs inline within prose */
  variant?: TextLinkVariant;
  /** Typography and hit-target size (sm, md, lg) */
  size?: TextLinkSize;
  /** Optional trailing icon */
  iconTrailing?: IconName;
  /** Renders as a non-interactive span when true */
  disabled?: boolean;
}

/**
 * Momentum Web text links — Standalone & Inline (`46864-23490` sticker sheet).
 *
 * @example
 * <TextLink href="/docs">Documentation</TextLink>
 */
export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(function TextLink(
  {
    children,
    variant = 'standalone',
    size = 'lg',
    iconTrailing,
    disabled = false,
    className = '',
    href,
    onClick,
    target,
    rel,
    ...rest
  },
  ref,
) {
  const cls = [
    'text-link',
    `text-link--${variant}`,
    `text-link--${size}`,
    disabled && 'text-link--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedRel =
    target === '_blank'
      ? ['noopener', 'noreferrer', ...(rel?.trim() ? rel.trim().split(/\s+/) : [])]
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .join(' ')
      : rel;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const content = iconTrailing ? (
    <span className="text-link__row">
      <span className="text-link__label">{children}</span>
      <span className="text-link__icon-wrap" aria-hidden>
        <Icon
          name={iconTrailing}
          weight="bold"
          size={size === 'sm' ? 'xs' : 'sm'}
          className="text-link__icon"
        />
      </span>
    </span>
  ) : (
    children
  );

  if (disabled) {
    return (
      <span className={cls} role="link" aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <a
      ref={ref}
      className={cls}
      href={href ?? '#'}
      onClick={handleClick}
      target={target}
      rel={resolvedRel}
      {...rest}
    >
      {content}
    </a>
  );
});
