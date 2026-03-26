import type { BrandLogoProps } from './types';

type Props = BrandLogoProps;

/**
 * Cisco AI assistant ring mark (shell utility button). Uses design-token sky blue.
 */
export function CiscoAiSymbolMark({
  height = 24,
  width: w,
  className,
  'aria-label': ariaLabel = 'AI assistant',
  'aria-hidden': ariaHidden,
}: Props) {
  const width = w ?? height;
  const stroke = 'var(--color-theme-text-accent-normal, var(--accent-color))';

  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? (!ariaLabel ? true : undefined)}
      role="img"
    >
      <circle cx="16" cy="16" r="14" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="16" cy="12" r="4" fill={stroke} />
      <path
        d="M10 22c0-3.3 2.7-6 6-6s6 2.7 6 6"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );
}
