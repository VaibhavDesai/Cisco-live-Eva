import type { BrandLogoProps } from './types';
import { logoFill } from './logoTone';

type Props = BrandLogoProps;

/**
 * Cisco bridge symbol (vertical bars). Single-color mark for lockups.
 * Figma: Brand Visuals Library — Logos / Cisco mark variants.
 */
export function CiscoBridgeMark({
  height = 24,
  width: w,
  className,
  tone = 'inherit',
  'aria-label': ariaLabel = 'Cisco',
  'aria-hidden': ariaHidden,
}: Props) {
  const fill = logoFill(tone);
  const aspect = 32 / 22;
  const width = w ?? Math.round(height * aspect);

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 32 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? (!ariaLabel ? true : undefined)}
      role="img"
    >
      <g fill={fill}>
        <rect x="0" y="10" width="2.4" height="12" rx="0.4" />
        <rect x="4.2" y="7" width="2.4" height="15" rx="0.4" />
        <rect x="8.4" y="4.5" width="2.4" height="17.5" rx="0.4" />
        <rect x="12.6" y="2.5" width="2.4" height="19.5" rx="0.4" />
        <rect x="16.8" y="0" width="2.4" height="22" rx="0.4" />
        <rect x="21" y="2.5" width="2.4" height="19.5" rx="0.4" />
        <rect x="25.2" y="4.5" width="2.4" height="17.5" rx="0.4" />
        <rect x="29.4" y="7" width="2.4" height="15" rx="0.4" />
      </g>
    </svg>
  );
}
