import { Icon } from '../../icons/Icon';

/** Layout density: full default chrome vs compact inline track */
export type ProgressBarVariant = 'default' | 'inline';
/** Semantic completion state for color and optional helper icons */
export type ProgressBarStatus = 'in-progress' | 'complete' | 'failed';

export interface ProgressBarProps {
  /** Filled portion as a percentage from 0 to 100 */
  value: number;
  /** Chooses default stacked layout vs inline label-with-track */
  variant?: ProgressBarVariant;
  /** Drives success, failure, or in-progress presentation */
  status?: ProgressBarStatus;
  /** Primary label beside or above the track */
  label?: string;
  /** Secondary copy shown below the track on the default variant */
  helperText?: string;
  /** Toggles the numeric percent readout (inline defaults differ) */
  showPercent?: boolean;
  /** Extra class names on the root element */
  className?: string;
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * Renders an accessible progress track with optional label, percent, and helper row.
 *
 * @example
 * <ProgressBar value={75} label="Syncing" status="in-progress" helperText="Do not close this window." />
 */
export function ProgressBar({
  value,
  variant = 'default',
  status = 'in-progress',
  label,
  helperText,
  showPercent,
  className = '',
}: ProgressBarProps) {
  const pct = clampPct(value);
  const showPct =
    showPercent ??
    (variant === 'default' &&
      (status === 'in-progress' || status === 'complete' || status === 'failed'));

  const statusClass =
    status === 'complete' ? 'progress-bar--success' : status === 'failed' ? 'progress-bar--failed' : '';

  const helperIcon =
    status === 'complete' ? (
      <Icon name="check-circle" weight="bold" size={16} />
    ) : status === 'failed' ? (
      <Icon name="error-legacy" weight="bold" size={16} />
    ) : null;

  const rootCls = ['progress-bar', variant === 'inline' && 'progress-bar--inline', statusClass, className]
    .filter(Boolean)
    .join(' ');

  const track = (
    <div className="progress-bar__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={rootCls}>
        {label ? <span className="progress-bar__label">{label}</span> : null}
        {track}
      </div>
    );
  }

  return (
    <div className={rootCls}>
      {(label || showPct) && (
        <div className="progress-bar__header">
          {label ? (
            <span className="progress-bar__label">{label}</span>
          ) : (
            <span className="progress-bar__label" />
          )}
          {showPct ? <span className="progress-bar__percent">{Math.round(pct)}%</span> : null}
        </div>
      )}
      {track}
      {helperText ? (
        <div className="progress-bar__helper">
          {helperIcon ? <span className="progress-bar__helper-icon">{helperIcon}</span> : null}
          <span className="progress-bar__helper-text">{helperText}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Default export alias for {@link ProgressBar} */
export default ProgressBar;
