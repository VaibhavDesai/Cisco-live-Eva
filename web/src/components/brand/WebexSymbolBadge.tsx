import type { BrandLogoProps } from './types';
import { logoFill } from './logoTone';

type Props = BrandLogoProps;

/**
 * Compact “W” bar mark for fav stripes / app icon treatments (simplified geometric).
 * Replace paths when Figma exports the official symbol from node 421-2344.
 */
export function WebexSymbolBadge({
  height = 24,
  width: w,
  className,
  tone = 'inherit',
  'aria-label': ariaLabel = 'Webex',
  'aria-hidden': ariaHidden,
}: Props) {
  const fill = logoFill(tone);
  const width = w ?? height;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? undefined}
      role="img"
    >
      <path
        fill={tone === 'inherit' ? 'var(--accent-bg)' : fill}
        d="M4 18V6l4.2 6L12 7.2 15.8 12 20 6v12h-2.5v-7l-3.5 5-3.5-5.2L6.5 17V18H4z"
      />
    </svg>
  );
}
