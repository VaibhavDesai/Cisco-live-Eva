import { forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SpinnerSize = 'small' | 'midsize' | 'large';
export type SpinnerColor = 'default' | 'inverted';

export interface SpinnerProps {
  /** Preset size (small, midsize, or large) */
  size?: SpinnerSize;
  /** Stroke color: default accent or inverted for dark backgrounds */
  color?: SpinnerColor;
  /** Accessible name announced for the status indicator */
  'aria-label'?: string;
  /** Additional CSS classes on the root */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIZE_CLS: Record<SpinnerSize, string> = {
  small: 'spinner-sm',
  midsize: 'spinner-md',
  large: 'spinner-lg',
};

const VIEWBOX = 48;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~125.66
const ARC_LENGTH = CIRCUMFERENCE * 0.25;
const DASH_OFFSET = CIRCUMFERENCE - ARC_LENGTH;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Accessible loading spinner with preset sizes and color variants.
 * @example
 * <Spinner size="small" aria-label="Loading results" />
 */
const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner(
  {
    size = 'midsize',
    color = 'default',
    'aria-label': ariaLabel = 'Loading',
    className = '',
  },
  ref,
) {
  const cls = [
    'spinner',
    SIZE_CLS[size],
    color === 'inverted' && 'spinner-inverted',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={cls} role="status" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} xmlns="http://www.w3.org/2000/svg">
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          strokeDasharray={`${ARC_LENGTH} ${DASH_OFFSET}`}
        />
      </svg>
    </div>
  );
});

export default Spinner;
