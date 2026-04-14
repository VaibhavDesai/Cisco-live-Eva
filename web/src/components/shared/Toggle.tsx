import {
  forwardRef,
  useCallback,
  useId,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { Icon } from '../../icons/Icon';

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

export interface ToggleProps {
  /** Current on/off state */
  checked?: boolean;
  /** Called when the switch value changes */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Prevents interaction and dims the control */
  disabled?: boolean;
  /** Shows state but ignores user-driven toggles */
  readOnly?: boolean;
  /** Primary label beside the switch */
  label?: ReactNode;
  /** Secondary hint below the label */
  helperText?: ReactNode;
  /** Switch size: default (48×24) or compact (32×16, no handle icon) */
  size?: 'default' | 'compact';
  /** Extra classes on the root label */
  className?: string;
  /** DOM id for the input (and label `htmlFor`) */
  id?: string;
  /** Form field name for the underlying checkbox */
  name?: string;
  /** Accessible name when there is no visible label */
  'aria-label'?: string;
}

/**
 * Checkbox-based switch with optional label, helper text, and compact sizing.
 *
 * @example
 * <Toggle checked={on} onChange={(e) => setOn(e.target.checked)} label="Notifications" />
 */
const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  function Toggle(
    {
      checked = false,
      onChange,
      disabled = false,
      readOnly = false,
      label,
      helperText,
      size = 'default',
      className = '',
      id: idProp,
      name,
      'aria-label': ariaLabel,
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = idProp ?? autoId;

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        onChange?.(e);
      },
      [onChange, readOnly],
    );

    const rootCls = [
      'toggle',
      size === 'compact' ? 'toggle-compact' : '',
      disabled ? 'toggle-disabled' : '',
      readOnly ? 'toggle-readonly' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label className={rootCls} htmlFor={inputId}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          name={name}
          className="toggle-input"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          role="switch"
          aria-checked={checked}
          aria-label={!label ? ariaLabel : undefined}
        />
        <span className="toggle-track">
          <span className="toggle-handle">
            <span className="toggle-handle-icon">
              <Icon
                name={checked ? 'check' : 'cancel'}
                weight="bold"
                size={12}
              />
            </span>
          </span>
        </span>
        {(label || helperText) && (
          <span className="toggle-label-area">
            {label && <span className="toggle-label">{label}</span>}
            {helperText && <span className="toggle-helper">{helperText}</span>}
          </span>
        )}
      </label>
    );
  },
);

export default Toggle;

/* ------------------------------------------------------------------ */
/*  ToggleGroup                                                        */
/* ------------------------------------------------------------------ */

export interface ToggleGroupProps {
  /** Group heading shown above the toggles */
  label?: ReactNode;
  /** Secondary hint for the whole group */
  helperText?: ReactNode;
  /** Shows a required asterisk next to the group label */
  required?: boolean;
  /** Toggle components belonging to this group */
  children: ReactNode;
  /** Extra classes on the group wrapper */
  className?: string;
}

/**
 * Wraps related toggles with a labeled `role="group"` region and optional required marker.
 *
 * @example
 * <ToggleGroup label="Preferences" required>
 *   <Toggle label="Email" checked />
 * </ToggleGroup>
 */
export function ToggleGroup({
  label,
  helperText,
  required = false,
  children,
  className = '',
}: ToggleGroupProps) {
  return (
    <div
      className={`toggle-group${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {(label || helperText) && (
        <div className="toggle-group-header">
          {label && (
            <div className="toggle-group-label-row">
              <span className="toggle-group-label">
                {label}
                {required && <span className="required-indicator">*</span>}
              </span>
            </div>
          )}
          {helperText && (
            <span className="toggle-group-helper">{helperText}</span>
          )}
        </div>
      )}
      <div className="toggle-group-list">{children}</div>
    </div>
  );
}
