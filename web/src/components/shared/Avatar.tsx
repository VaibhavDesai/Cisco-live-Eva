import {
  type CSSProperties,
  type ImgHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/** Figma Avatar sizes (`46-2308`) */
export type AvatarSizeToken =
  | '2x-small'
  | 'x-small'
  | 'small'
  | 'midsize'
  | 'large'
  | 'x-large'
  | '2x-large';

const SIZE_PX: Record<AvatarSizeToken, number> = {
  '2x-small': 24,
  'x-small': 32,
  small: 48,
  midsize: 64,
  large: 72,
  'x-large': 88,
  '2x-large': 124,
};

export type AvatarVariant = 'photo' | 'initials' | 'icon';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Photo, initials, or icon presentation */
  variant?: AvatarVariant;
  /** Design token size or pixel diameter */
  size?: AvatarSizeToken | number;
  /** Profile image URL when variant is photo */
  src?: string;
  /** Alternative text for the profile image */
  alt?: string;
  /** Extra attributes for the inner img (not src, alt, className, or style) */
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className' | 'style'>;
  /** Initials text when variant is initials (or fallback) */
  initials?: string;
  /** Momentum icon name when variant is icon */
  icon?: IconName;
  /** Optional numeric badge (e.g. unread count) */
  badgeCount?: number;
  /** Additional CSS class on the avatar root */
  className?: string;
  /** Inline styles merged onto the avatar root */
  style?: CSSProperties;
}

/**
 * Momentum Web Avatar (`46-2308`) — photo, initials, or icon; optional counter badge.
 *
 * @example
 * <Avatar variant="photo" src="/avatar.png" alt="Jane Doe" size="small" />
 */
export default function Avatar({
  variant = 'photo',
  size = 'x-small',
  src,
  alt = '',
  imgProps,
  initials,
  icon = 'user',
  badgeCount,
  className = '',
  style,
  ...rest
}: AvatarProps) {
  const px = typeof size === 'number' ? size : SIZE_PX[size];
  const dim: CSSProperties = {
    width: px,
    height: px,
    fontSize: Math.max(10, px * 0.35),
    ...style,
  };
  const cls = `avatar ${className}`.trim();

  let inner: ReactNode;

  if (variant === 'photo' && src) {
    inner = (
      <img src={src} alt={alt} className={cls} style={dim} {...imgProps} />
    );
  } else if (variant === 'icon') {
    inner = (
      <div className={`${cls} avatar--icon`} style={dim} {...rest}>
        <Icon name={icon} weight="regular" size={Math.min(px * 0.45, 32)} />
      </div>
    );
  } else {
    inner = (
      <div className={`${cls} avatar-initials`} style={dim} {...rest}>
        {initials ?? '?'}
      </div>
    );
  }

  if (badgeCount != null && badgeCount > 0) {
    return (
      <span className="avatar-wrap">
        {inner}
        <span className="avatar__badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
      </span>
    );
  }

  return inner;
}

export { SIZE_PX as AVATAR_SIZE_PX };
