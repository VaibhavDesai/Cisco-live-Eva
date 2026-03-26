import { Icon } from '../../icons/Icon';

export type ProgressBarVariant = 'default' | 'inline';
export type ProgressBarStatus = 'in-progress' | 'complete' | 'failed';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  variant?: ProgressBarVariant;
  status?: ProgressBarStatus;
  label?: string;
  /** Shown below the track in default variant */
  helperText?: string;
  /** Show numeric percent (default variant); inline hides by default */
  showPercent?: boolean;
  className?: string;
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

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

export default ProgressBar;
