import type { BrandLogoProps } from './types';
import { logoFill } from './logoTone';

type Props = BrandLogoProps;

/**
 * Webex wordmark (typographic). Uses CiscoSans for parity with app shell.
 * For vector-outlined artwork exported from Figma, replace inner markup with exported paths.
 */
export function WebexWordmark({
  height = 22,
  className,
  tone = 'inherit',
  'aria-label': ariaLabel = 'Webex',
  'aria-hidden': ariaHidden,
}: Props) {
  const color = logoFill(tone);
  const fontSize = Math.max(12, Math.round(height * 0.82));

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: tone === 'inherit' ? 'var(--text-primary)' : color,
        fontFamily: "var(--mds-font-family-primary, 'CiscoSansTT', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}
      role="img"
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? undefined}
    >
      webex
    </span>
  );
}
