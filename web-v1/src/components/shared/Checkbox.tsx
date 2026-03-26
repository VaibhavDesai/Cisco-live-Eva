import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Icon } from '../../icons/Icon';

/* ------------------------------------------------------------------ */
/*  Checkbox                                                           */
/* ------------------------------------------------------------------ */

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: ReactNode;
  helperText?: string;
  indeterminate?: boolean;
  validation?: 'error' | 'warning' | 'success';
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      helperText,
      indeterminate = false,
      validation,
      disabled = false,
      readOnly = false,
      checked,
      defaultChecked,
      className = '',
      id: externalId,
      onChange,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = externalId ?? autoId;
    const internalRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const stateClasses = [
      'checkbox',
      validation ?? '',
      disabled ? 'disabled' : '',
      readOnly ? 'readonly' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const validationIcon =
      validation === 'error'
        ? 'error-legacy'
        : validation === 'warning'
          ? 'warning'
          : validation === 'success'
            ? 'check-circle'
            : null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      onChange?.(e.target.checked, e);
    };

    return (
      <label className={stateClasses} htmlFor={inputId}>
        <input
          ref={setRefs}
          id={inputId}
          type="checkbox"
          className="checkbox-input"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          aria-invalid={validation === 'error' ? true : undefined}
          {...rest}
        />
        <span className="checkbox-box" aria-hidden="true">
          {indeterminate ? (
            <Icon name="minus" weight="bold" size={12} />
          ) : (
            <Icon name="check" weight="bold" size={12} />
          )}
        </span>
        {(label || helperText) && (
          <span className="checkbox-label">
            {label && <span className="checkbox-label-text">{label}</span>}
            {helperText && (
              <span className={`checkbox-helper${validation ? ` ${validation}` : ''}`}>
                {validationIcon && <Icon name={validationIcon as any} weight="bold" size={16} />}
                {helperText}
              </span>
            )}
          </span>
        )}
      </label>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  CheckboxGroup                                                      */
/* ------------------------------------------------------------------ */

export interface CheckboxGroupProps {
  label?: string;
  helperText?: string;
  required?: boolean;
  validation?: 'error' | 'warning' | 'success';
  children: ReactNode;
  className?: string;
}

export function CheckboxGroup({
  label,
  helperText,
  required = false,
  validation,
  children,
  className = '',
}: CheckboxGroupProps) {
  const validationIcon =
    validation === 'error'
      ? 'error-legacy'
      : validation === 'warning'
        ? 'warning'
        : validation === 'success'
          ? 'check-circle'
          : null;

  return (
    <fieldset
      className={`checkbox-group${className ? ` ${className}` : ''}`}
      role="group"
      aria-required={required || undefined}
    >
      {(label || helperText) && (
        <div className="checkbox-group-header">
          {label && (
            <legend className="checkbox-group-label">
              {label}
              {required && <span className="required">*</span>}
            </legend>
          )}
          {helperText && (
            <span className={`checkbox-group-helper${validation ? ` ${validation}` : ''}`}>
            {validationIcon && <Icon name={validationIcon as any} weight="bold" size={16} />}
            {helperText}
          </span>
        )}
        </div>
      )}
      <div className="checkbox-group-list">{children}</div>
    </fieldset>
  );
}
