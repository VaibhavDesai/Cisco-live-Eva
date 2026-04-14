import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Radio group context                                                */
/* ------------------------------------------------------------------ */

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Radio                                                              */
/* ------------------------------------------------------------------ */

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Value for this option when selected */
  value: string;
  /** Visible label next to the control */
  label?: ReactNode;
  /** Secondary hint shown under the label */
  helperText?: string;
  /** Called with this option's value when used outside `RadioGroup` (with `name` / `checked`) */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Single radio option; use inside `RadioGroup` for shared name and selection state.
 * @example
 * <RadioGroup name="plan" value={v} onChange={setV}>
 *   <Radio value="pro" label="Pro" />
 * </RadioGroup>
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value: radioValue,
    label,
    helperText,
    disabled = false,
    readOnly = false,
    className = '',
    id: externalId,
    name: nameProp,
    checked: checkedProp,
    onChange: onChangeProp,
    ...rest
  },
  ref,
) {
  const ctx = useContext(RadioGroupContext);
  const autoId = useId();
  const inputId = externalId ?? autoId;

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref],
  );

  const name = ctx?.name ?? nameProp ?? '';
  const checked = ctx ? ctx.value === radioValue : !!checkedProp;

  const stateClasses = ['radio', disabled ? 'disabled' : '', readOnly ? 'readonly' : '', className]
    .filter(Boolean)
    .join(' ');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    if (ctx) ctx.onChange(radioValue);
    else onChangeProp?.(radioValue, e);
  };

  return (
    <label className={stateClasses} htmlFor={inputId}>
      <input
        ref={setRefs}
        id={inputId}
        type="radio"
        name={name}
        value={radioValue}
        className="radio-input"
        checked={checked}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        {...rest}
      />
      <span className="radio-circle" aria-hidden="true" />
      {(label || helperText) && (
        <span className="radio-label">
          {label && <span className="radio-label-text">{label}</span>}
          {helperText && <span className="radio-helper">{helperText}</span>}
        </span>
      )}
    </label>
  );
});

/* ------------------------------------------------------------------ */
/*  RadioGroup                                                         */
/* ------------------------------------------------------------------ */

export interface RadioGroupProps {
  /** Shared `name` attribute for grouped radio inputs */
  name: string;
  /** Value of the currently selected option */
  value: string;
  /** Called when the user selects a different option */
  onChange: (value: string) => void;
  /** Legend text shown above the group */
  label?: string;
  /** Helper text describing the group */
  helperText?: string;
  /** When true, shows a required indicator on the legend */
  required?: boolean;
  /** Radio options rendered inside the group */
  children: ReactNode;
  /** Additional CSS classes on the fieldset */
  className?: string;
}

/**
 * Provides context so nested `Radio` components share name and controlled value.
 * @example
 * <RadioGroup name="tier" value={tier} onChange={setTier} label="Choose a tier">
 *   <Radio value="std" label="Standard" />
 * </RadioGroup>
 */
export function RadioGroup({
  name,
  value,
  onChange,
  label,
  helperText,
  required = false,
  children,
  className = '',
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange }}>
      <fieldset
        className={`radio-group${className ? ` ${className}` : ''}`}
        role="radiogroup"
        aria-required={required || undefined}
      >
        {(label || helperText) && (
          <div className="radio-group-header">
            {label && (
              <legend className="radio-group-label">
                {label}
                {required && <span className="required">*</span>}
              </legend>
            )}
            {helperText && <p className="radio-group-helper">{helperText}</p>}
          </div>
        )}
        <div className="radio-group-list">{children}</div>
      </fieldset>
    </RadioGroupContext.Provider>
  );
}
