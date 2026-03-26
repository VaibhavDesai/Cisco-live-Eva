import React, { forwardRef, useId } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

type ValidationState = 'error' | 'warning' | 'success' | undefined;

const VALIDATION_ICON: Record<string, { name: IconName; color: string }> = {
  error:   { name: 'error-legacy' as IconName, color: 'var(--danger-color)' },
  warning: { name: 'warning'      as IconName, color: 'var(--warning-color)' },
  success: { name: 'check-circle' as IconName, color: 'var(--success-color)' },
};

/* ─── Input ───────────────────────────────────────────────────── */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  required?: boolean;
  hint?: string;
  validation?: ValidationState;
  maxLength?: number;
  showCharCount?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required = false,
      hint,
      validation,
      maxLength,
      showCharCount = false,
      leadingIcon,
      trailingIcon,
      clearable = false,
      onClear,
      className = '',
      inputClassName = '',
      value,
      disabled,
      readOnly,
      id: externalId,
      ...inputProps
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;
    const hasIcons = leadingIcon || trailingIcon || clearable;
    const showClear = clearable && value && !disabled && !readOnly;

    const wrapperCls = [
      'form-input-wrapper',
      validation,
      disabled && 'disabled',
      readOnly && 'readonly',
    ]
      .filter(Boolean)
      .join(' ');

    const inputCls = ['form-input', !hasIcons && validation, inputClassName]
      .filter(Boolean)
      .join(' ');

    const hintCls = ['form-hint', validation].filter(Boolean).join(' ');

    const renderInput = (
      <input
        ref={ref}
        id={inputId}
        className={inputCls}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        {...inputProps}
      />
    );

    return (
      <div className={`form-group ${className}`}>
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}

        {hasIcons ? (
          <div className={wrapperCls}>
            {leadingIcon && (
              <span className="form-input-icon">
                <Icon name={leadingIcon} weight="regular" size={16} />
              </span>
            )}
            {renderInput}
            {showClear && (
              <button
                type="button"
                className="form-input-clear"
                onClick={onClear}
                tabIndex={-1}
                aria-label="Clear input"
              >
                <Icon name={'cancel' as IconName} weight="bold" size={16} />
              </button>
            )}
            {trailingIcon && (
              <span className="form-input-icon">
                <Icon name={trailingIcon} weight="regular" size={16} />
              </span>
            )}
          </div>
        ) : (
          renderInput
        )}

        {(hint || showCharCount) && (
          <div className="form-helper-row">
            {hint && (
              <span className={hintCls}>
                {validation && VALIDATION_ICON[validation] && (
                  <Icon
                    name={VALIDATION_ICON[validation].name}
                    weight="bold"
                    size={16}
                    color={VALIDATION_ICON[validation].color}
                  />
                )}
                {hint}
              </span>
            )}
            {showCharCount && maxLength != null && (
              <span className="form-char-count">
                {String(value ?? '').length}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

/* ─── Textarea ────────────────────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  validation?: ValidationState;
  maxLength?: number;
  showCharCount?: boolean;
  /** Show character count inside the field (bottom-right) instead of below */
  inlineCharCount?: boolean;
  className?: string;
  inputClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required = false,
      hint,
      validation,
      maxLength,
      showCharCount = false,
      inlineCharCount = false,
      className = '',
      inputClassName = '',
      value,
      disabled,
      readOnly,
      id: externalId,
      rows = 4,
      ...textareaProps
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;

    const wrapperCls = [
      'form-textarea-wrapper',
      validation,
      disabled && 'disabled',
      readOnly && 'readonly',
    ]
      .filter(Boolean)
      .join(' ');

    const textareaCls = ['form-textarea', inputClassName]
      .filter(Boolean)
      .join(' ');

    const hintCls = ['form-hint', validation].filter(Boolean).join(' ');

    const charLen = String(value ?? '').length;
    const showInlineCount = inlineCharCount && showCharCount && maxLength != null;
    const showExternalCount = !inlineCharCount && showCharCount && maxLength != null;

    return (
      <div className={`form-group ${className}`}>
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className={wrapperCls}>
          <textarea
            ref={ref}
            id={inputId}
            className={textareaCls}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            rows={rows}
            aria-invalid={validation === 'error' || undefined}
            {...textareaProps}
          />
          {showInlineCount && (
            <div className="form-textarea-bottom">
              <span className="form-textarea-char-count">
                {charLen}/{maxLength}
              </span>
            </div>
          )}
        </div>
        {(hint || showExternalCount) && (
          <div className="form-helper-row">
            {hint && (
              <span className={hintCls}>
                {validation && VALIDATION_ICON[validation] && (
                  <Icon
                    name={VALIDATION_ICON[validation].name}
                    weight="bold"
                    size={16}
                    color={VALIDATION_ICON[validation].color}
                  />
                )}
                {hint}
              </span>
            )}
            {showExternalCount && (
              <span className="form-char-count">
                {charLen}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

/* ─── Select ──────────────────────────────────────────────────── */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  validation?: ValidationState;
  className?: string;
  inputClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      required = false,
      hint,
      validation,
      className = '',
      inputClassName = '',
      disabled,
      children,
      id: externalId,
      ...selectProps
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;

    const inputCls = ['form-input', validation, inputClassName]
      .filter(Boolean)
      .join(' ');

    const hintCls = ['form-hint', validation].filter(Boolean).join(' ');

    return (
      <div className={`form-group ${className}`}>
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={inputCls}
          disabled={disabled}
          {...selectProps}
        >
          {children}
        </select>
        {hint && (
          <span className={hintCls}>
            {validation && VALIDATION_ICON[validation] && (
              <Icon
                name={VALIDATION_ICON[validation].name}
                weight="bold"
                size={16}
                color={VALIDATION_ICON[validation].color}
              />
            )}
            {hint}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

/* ─── Option ──────────────────────────────────────────────────── */

export function Option({
  value,
  children,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}

/* ─── Compound helpers ────────────────────────────────────────── */

export function FormGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`form-group ${className}`}>{children}</div>;
}

export function FormLabel({
  children,
  required = false,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label className="form-label" htmlFor={htmlFor}>
      {children} {required && <span className="required">*</span>}
    </label>
  );
}

export function FormHint({
  children,
  validation,
}: {
  children: React.ReactNode;
  validation?: ValidationState;
}) {
  const cls = ['form-hint', validation].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {validation && VALIDATION_ICON[validation] && (
        <Icon
          name={VALIDATION_ICON[validation].name}
          weight="bold"
          size={16}
          color={VALIDATION_ICON[validation].color}
        />
      )}
      {children}
    </span>
  );
}

export function FormHelperRow({ children }: { children: React.ReactNode }) {
  return <div className="form-helper-row">{children}</div>;
}

export default Input;
