import { forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SpinnerSize = 'small' | 'midsize' | 'large';
export type SpinnerColor = 'default' | 'inverted';

export interface SpinnerProps {
  /** small=24px, midsize=48px, large=96px */
  size?: SpinnerSize;
  /** default=accent blue, inverted=white */
  color?: SpinnerColor;
  /** Accessible label for screen readers */
  'aria-label'?: string;
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
