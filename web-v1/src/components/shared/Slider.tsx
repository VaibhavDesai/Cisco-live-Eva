import { TooltipTonalBackdrop } from './TooltipTonalBackdrop';
import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SliderProps {
  /** Current value (single) or [min, max] tuple (range) */
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Label shown above the track */
  label?: ReactNode;
  /** Show min/max text labels below the track */
  showValueLabels?: boolean;
  /** Custom min label (defaults to `min`) */
  minLabel?: string;
  /** Custom max label (defaults to `max`) */
  maxLabel?: string;
  /** Custom mid-point label shown between min and max */
  midLabel?: string;
  /** Show tick marks (stepped mode) */
  showTicks?: boolean;
  /** Show step value labels below the track */
  showStepLabels?: boolean;
  /** Show tooltip on drag */
  showTooltip?: boolean;
  /** Format the tooltip value */
  formatTooltip?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(val: number, lo: number, hi: number) {
  return Math.min(Math.max(val, lo), hi);
}

function snapToStep(val: number, min: number, step: number) {
  const raw = Math.round((val - min) / step) * step + min;
  const decimals = (step.toString().split('.')[1] || '').length;
  return Number(raw.toFixed(decimals));
}

function pct(val: number, min: number, max: number) {
  if (max === min) return 0;
  return ((val - min) / (max - min)) * 100;
}

/* ------------------------------------------------------------------ */
/*  Slider                                                             */
/* ------------------------------------------------------------------ */

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  function Slider(
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      showValueLabels = false,
      minLabel,
      maxLabel,
      midLabel,
      showTicks = false,
      showStepLabels = false,
      showTooltip = false,
      formatTooltip,
      disabled = false,
      className = '',
      'aria-label': ariaLabel,
    },
    ref,
  ) {
    const isRange = Array.isArray(value);
    const singleVal = isRange ? 0 : (value as number);
    const rangeVal = isRange ? (value as [number, number]) : [min, singleVal];

    const trackRef = useRef<HTMLDivElement>(null);
    const [activeThumb, setActiveThumb] = useState<'start' | 'end' | null>(null);
    const [hoverThumb, setHoverThumb] = useState<'start' | 'end' | null>(null);

    const valueFromPointer = useCallback(
      (clientX: number) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return min;
        const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
        const raw = min + ratio * (max - min);
        return clamp(snapToStep(raw, min, step), min, max);
      },
      [min, max, step],
    );

    const updateValue = useCallback(
      (newVal: number, thumb: 'start' | 'end') => {
        if (disabled) return;
        if (isRange) {
          const [lo, hi] = rangeVal;
          if (thumb === 'start') {
            onChange([Math.min(newVal, hi), hi]);
          } else {
            onChange([lo, Math.max(newVal, lo)]);
          }
        } else {
          onChange(newVal);
        }
      },
      [disabled, isRange, rangeVal, onChange],
    );

    const handlePointerDown = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        const val = valueFromPointer(e.clientX);

        let thumb: 'start' | 'end';
        if (isRange) {
          const [lo, hi] = rangeVal;
          thumb =
            Math.abs(val - lo) <= Math.abs(val - hi) ? 'start' : 'end';
        } else {
          thumb = 'end';
        }

        setActiveThumb(thumb);
        updateValue(val, thumb);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      },
      [disabled, isRange, rangeVal, valueFromPointer, updateValue],
    );

    const handlePointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!activeThumb || disabled) return;
        updateValue(valueFromPointer(e.clientX), activeThumb);
      },
      [activeThumb, disabled, valueFromPointer, updateValue],
    );

    const handlePointerUp = useCallback(() => {
      setActiveThumb(null);
    }, []);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent, thumb: 'start' | 'end') => {
        if (disabled) return;
        const current = isRange
          ? (thumb === 'start' ? rangeVal[0] : rangeVal[1])
          : singleVal;
        let next = current;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          next = clamp(current + step, min, max);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          next = clamp(current - step, min, max);
        } else if (e.key === 'Home') {
          e.preventDefault();
          next = min;
        } else if (e.key === 'End') {
          e.preventDefault();
          next = max;
        } else {
          return;
        }
        updateValue(next, thumb);
      },
      [disabled, isRange, rangeVal, singleVal, step, min, max, updateValue],
    );

    useEffect(() => {
      const up = () => setActiveThumb(null);
      window.addEventListener('pointerup', up);
      return () => window.removeEventListener('pointerup', up);
    }, []);

    const tickCount = showTicks ? Math.round((max - min) / step) + 1 : 0;
    const stepLabels =
      showStepLabels && step > 0
        ? Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step)
        : [];

    const fillLeft = isRange ? pct(rangeVal[0], min, max) : 0;
    const fillRight = isRange ? pct(rangeVal[1], min, max) : pct(singleVal, min, max);

    const thumbEndPos = isRange ? pct(rangeVal[1], min, max) : pct(singleVal, min, max);
    const thumbStartPos = isRange ? pct(rangeVal[0], min, max) : 0;

    const tooltipVal = (thumb: 'start' | 'end') => {
      const v = isRange
        ? (thumb === 'start' ? rangeVal[0] : rangeVal[1])
        : singleVal;
      return formatTooltip ? formatTooltip(v) : String(v);
    };

    const rootCls = ['slider', disabled && 'disabled', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={rootCls} aria-label={ariaLabel}>
        {label && <span className="slider-label">{label}</span>}

        <div
          ref={trackRef}
          className="slider-track-container"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="slider-track">
            <div
              className="slider-track-fill"
              style={{
                left: `${fillLeft}%`,
                width: `${fillRight - fillLeft}%`,
              }}
            />
          </div>

          {showTicks && tickCount > 0 && (
            <div className="slider-ticks">
              {Array.from({ length: tickCount }, (_, i) => (
                <span key={i} className="slider-tick" />
              ))}
            </div>
          )}

          {isRange && (
            <div
              className={`slider-thumb${activeThumb === 'start' ? ' dragging' : ''}`}
              style={{ left: `${thumbStartPos}%` }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuemin={min}
              aria-valuemax={rangeVal[1]}
              aria-valuenow={rangeVal[0]}
              aria-disabled={disabled || undefined}
              aria-label={ariaLabel ? `${ariaLabel} minimum` : 'Minimum'}
              onKeyDown={(e) => handleKeyDown(e, 'start')}
              onPointerEnter={() => setHoverThumb('start')}
              onPointerLeave={() => setHoverThumb(null)}
            >
              {showTooltip && (activeThumb === 'start' || hoverThumb === 'start') && (
                <span className="slider-tooltip">
                  <TooltipTonalBackdrop />
                  <span className="tooltip-text">{tooltipVal('start')}</span>
                </span>
              )}
            </div>
          )}

          <div
            className={`slider-thumb${activeThumb === 'end' ? ' dragging' : ''}`}
            style={{ left: `${thumbEndPos}%` }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={isRange ? rangeVal[0] : min}
            aria-valuemax={max}
            aria-valuenow={isRange ? rangeVal[1] : singleVal}
            aria-disabled={disabled || undefined}
            aria-label={ariaLabel ? (isRange ? `${ariaLabel} maximum` : ariaLabel) : (isRange ? 'Maximum' : 'Value')}
            onKeyDown={(e) => handleKeyDown(e, 'end')}
            onPointerEnter={() => setHoverThumb('end')}
            onPointerLeave={() => setHoverThumb(null)}
          >
            {showTooltip && (activeThumb === 'end' || hoverThumb === 'end') && (
              <span className="slider-tooltip">
                <TooltipTonalBackdrop />
                <span className="tooltip-text">{tooltipVal('end')}</span>
              </span>
            )}
          </div>
        </div>

        {showValueLabels && (
          <div className="slider-value-labels">
            <span>{minLabel ?? min}</span>
            {midLabel != null && <span>{midLabel}</span>}
            <span>{maxLabel ?? max}</span>
          </div>
        )}

        {showStepLabels && stepLabels.length > 0 && (
          <div className="slider-step-labels">
            {stepLabels.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default Slider;
