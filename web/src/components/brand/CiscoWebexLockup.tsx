import type { BrandLogoProps } from './types';
import { CiscoBridgeMark } from './CiscoBridgeMark';
import { WebexWordmark } from './WebexWordmark';

type Props = BrandLogoProps & {
  tone?: import('./types').BrandLogoTone;
  /** `horizontal` — bridge left of wordmark; `stacked` — bridge centered above wordmark */
  layout?: 'horizontal' | 'stacked';
  gap?: number;
};

/**
 * Cisco + Webex combined lockup (Brand Visuals — combination marks).
 */
export function CiscoWebexLockup({
  height = 24,
  className,
  tone = 'inherit',
  layout = 'horizontal',
  gap = 10,
  'aria-label': ariaLabel = 'Cisco Webex',
  'aria-hidden': ariaHidden,
}: Props) {
  const bridgeH = Math.round(height * 0.92);
  const wordmarkH = Math.round(height * 0.85);

  if (layout === 'stacked') {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: Math.max(4, gap - 4),
        }}
        role="img"
        aria-label={ariaHidden ? undefined : ariaLabel}
        aria-hidden={ariaHidden ?? undefined}
      >
        <CiscoBridgeMark height={bridgeH} tone={tone} aria-hidden />
        <WebexWordmark height={wordmarkH} tone={tone} aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap,
      }}
      role="img"
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? undefined}
    >
      <CiscoBridgeMark height={bridgeH} tone={tone} aria-hidden />
      <WebexWordmark height={wordmarkH} tone={tone} aria-hidden />
    </span>
  );
}
