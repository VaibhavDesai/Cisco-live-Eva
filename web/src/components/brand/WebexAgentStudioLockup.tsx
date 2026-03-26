import type { BrandLogoProps } from './types';
import { WebexWordmark } from './WebexWordmark';

type Props = BrandLogoProps & {
  tone?: import('./types').BrandLogoTone;
  /** Product subtitle, e.g. AI Agent Studio */
  productName?: string;
};

/**
 * App header lockup: Webex wordmark + divider + product line (matches main shell).
 */
export function WebexAgentStudioLockup({
  height = 24,
  className,
  tone = 'inherit',
  productName = 'AI Agent Studio',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: Props) {
  const wordH = Math.round(height * 0.92);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0,
      }}
      aria-label={ariaLabel ?? `Webex ${productName}`}
      aria-hidden={ariaHidden}
    >
      <WebexWordmark height={wordH} tone={tone} aria-hidden />
      <span
        className="header-divider"
        style={{ marginLeft: 8, marginRight: 8, flexShrink: 0 }}
        aria-hidden
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: tone === 'onLight' ? '#000000' : tone === 'onDark' ? '#ffffff' : 'var(--text-primary)',
          fontFamily: "var(--mds-font-family-primary, 'CiscoSansTT', -apple-system, sans-serif)",
        }}
      >
        {productName}
      </span>
    </span>
  );
}
