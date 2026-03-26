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
  children: ReactNode;
  /** Standalone = block-level affordance; Inline = within body copy */
  variant?: TextLinkVariant;
  /** Matches Figma link sizes (row heights ~16 / 20 / 24) */
  size?: TextLinkSize;
  /** Trailing icon (wider hit target in Figma ~62px vs ~42px text-only) */
  iconTrailing?: IconName;
  disabled?: boolean;
}

/**
 * Momentum Web text links — Standalone & Inline (`46864-23490` sticker sheet).
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
