import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

type ValidationState = 'error' | 'warning' | 'success' | undefined;

const VALIDATION_ICON: Record<string, { name: IconName; color: string }> = {
  error:   { name: 'error-legacy' as IconName, color: 'var(--danger-color)' },
  warning: { name: 'warning'      as IconName, color: 'var(--warning-color)' },
  success: { name: 'check-circle' as IconName, color: 'var(--success-color)' },
};

type DictationTarget = HTMLInputElement | HTMLTextAreaElement;

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function appendDictationText(baseValue: string, transcript: string) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) return baseValue;
  if (!baseValue.trim()) return cleanTranscript;
  return `${baseValue.replace(/\s+$/, '')} ${cleanTranscript}`;
}

function createDictationChangeEvent<T extends DictationTarget>(
  value: string,
  name?: string,
): React.ChangeEvent<T> {
  const target = { value, name } as unknown as T;
  return {
    target,
    currentTarget: target,
  } as React.ChangeEvent<T>;
}

function useVoiceDictation<T extends DictationTarget>({
  value,
  name,
  disabled,
  readOnly,
  onChange,
}: {
  value: React.InputHTMLAttributes<T>['value'];
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: React.ChangeEventHandler<T>;
}) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const baseValueRef = useRef('');

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* SpeechRecognition can throw after it has already stopped. */
    }
    recognitionRef.current = null;
  }, []);

  const stopDictation = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggleDictation = useCallback(() => {
    if (disabled || readOnly || !onChange) return;
    if (recognitionRef.current) {
      stopDictation();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceError('Voice input is not available in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    baseValueRef.current = String(value ?? '');
    setVoiceError('');

    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result?.[0]?.transcript ?? '')
        .join(' ')
        .trim();
      onChange(createDictationChangeEvent<T>(appendDictationText(baseValueRef.current, transcript), name));
    };

    recognition.onerror = event => {
      setVoiceError(event.error === 'not-allowed' ? 'Microphone permission denied.' : 'Voice input failed. Please try again.');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError('Voice input failed. Please try again.');
    }
  }, [disabled, name, onChange, readOnly, stopDictation, value]);

  return {
    isListening,
    voiceError,
    voiceSupported: Boolean(getSpeechRecognitionConstructor()),
    toggleDictation,
  };
}

/* ─── Input ───────────────────────────────────────────────────── */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Visible label text above the field */
  label?: string;
  /** When true, shows a required asterisk in the label */
  required?: boolean;
  /** Helper or validation message shown below the field */
  hint?: string;
  /** Applies validation styling and an icon in the hint row */
  validation?: ValidationState;
  /** HTML maxlength forwarded to the input */
  maxLength?: number;
  /** Shows current length vs maxLength in the helper row */
  showCharCount?: boolean;
  /** Icon displayed at the start of the input */
  leadingIcon?: IconName;
  /** Icon displayed at the end of the input */
  trailingIcon?: IconName;
  /** Static text/content rendered inside the field, before the input (e.g. "https://") */
  prefix?: React.ReactNode;
  /** Shows a clear control when the field has a value */
  clearable?: boolean;
  /** Handler invoked when the clear control is pressed */
  onClear?: () => void;
  /** Adds a microphone control that dictates spoken words into the text field */
  voiceInput?: boolean;
  /** Classes applied to the outer form-group wrapper */
  className?: string;
  /** Classes merged onto the native input element */
  inputClassName?: string;
}

/**
 * Single-line text field with optional label, icons, validation hint, and character count.
 * @example
 * <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
 */
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
      prefix,
      clearable = false,
      onClear,
      voiceInput = true,
      className = '',
      inputClassName = '',
      value,
      disabled,
      readOnly,
      id: externalId,
      onChange,
      ...inputProps
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;
    const inputType = typeof inputProps.type === 'string' ? inputProps.type : 'text';
    const semanticLabel = [
      typeof label === 'string' ? label : '',
      typeof inputProps.placeholder === 'string' ? inputProps.placeholder : '',
      typeof inputProps['aria-label'] === 'string' ? inputProps['aria-label'] : '',
    ].join(' ').toLowerCase();
    const textLikeType = ['', 'text'].includes(inputType);
    const semanticVoiceExcluded = /\b(search|url|link|email|phone|number|id|destination)\b/.test(semanticLabel);
    const showVoiceInput = Boolean(voiceInput && onChange && !disabled && !readOnly && textLikeType && !semanticVoiceExcluded);
    const hasIcons = leadingIcon || trailingIcon || clearable || prefix || showVoiceInput;
    const showClear = clearable && value && !disabled && !readOnly;
    const { isListening, voiceError, voiceSupported, toggleDictation } = useVoiceDictation<HTMLInputElement>({
      value,
      name: inputProps.name,
      disabled,
      readOnly,
      onChange,
    });

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
        onChange={onChange}
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
            {prefix && <span className="form-input-prefix">{prefix}</span>}
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
            {showVoiceInput && voiceSupported && (
              <button
                type="button"
                className={`form-voice-input-button${isListening ? ' listening' : ''}`}
                onMouseDown={event => event.preventDefault()}
                onClick={toggleDictation}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                aria-pressed={isListening}
              >
                <Icon name={(isListening ? 'stop-circle' : 'microphone') as IconName} weight="bold" size={16} />
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

        {(hint || showCharCount || voiceError) && (
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
            {voiceError && <span className="form-hint error">{voiceError}</span>}
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
  /** Visible label text above the field */
  label?: string;
  /** When true, shows a required asterisk in the label */
  required?: boolean;
  /** Helper or validation message shown below the field */
  hint?: string;
  /** Applies validation styling and an icon in the hint row */
  validation?: ValidationState;
  /** HTML maxlength forwarded to the textarea */
  maxLength?: number;
  /** Shows current length vs maxLength */
  showCharCount?: boolean;
  /** Character count inside the field (bottom-right) instead of below */
  inlineCharCount?: boolean;
  /** Classes applied to the outer form-group wrapper */
  className?: string;
  /** Classes merged onto the native textarea element */
  inputClassName?: string;
  /** Adds a microphone control that dictates spoken words into the text area */
  voiceInput?: boolean;
}

/**
 * Multi-line text field with optional label, validation hint, and character count.
 * @example
 * <Textarea label="Description" value={text} onChange={(e) => setText(e.target.value)} />
 */
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
      voiceInput = true,
      className = '',
      inputClassName = '',
      value,
      disabled,
      readOnly,
      id: externalId,
      rows = 4,
      onChange,
      ...textareaProps
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;
    const showVoiceInput = Boolean(voiceInput && onChange && !disabled && !readOnly);
    const { isListening, voiceError, voiceSupported, toggleDictation } = useVoiceDictation<HTMLTextAreaElement>({
      value,
      name: textareaProps.name,
      disabled,
      readOnly,
      onChange,
    });

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
    const showTextareaBottom = showInlineCount || (showVoiceInput && voiceSupported);

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
            onChange={onChange}
            {...textareaProps}
          />
          {showTextareaBottom && (
            <div className="form-textarea-bottom">
              {showInlineCount && (
                <span className="form-textarea-char-count">
                  {charLen}/{maxLength}
                </span>
              )}
              {showVoiceInput && voiceSupported && (
                <button
                  type="button"
                  className={`form-voice-input-button${isListening ? ' listening' : ''}`}
                  onMouseDown={event => event.preventDefault()}
                  onClick={toggleDictation}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  aria-pressed={isListening}
                >
                  <Icon name={(isListening ? 'stop-circle' : 'microphone') as IconName} weight="bold" size={16} />
                </button>
              )}
            </div>
          )}
        </div>
        {(hint || showExternalCount || voiceError) && (
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
            {voiceError && <span className="form-hint error">{voiceError}</span>}
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
  /** Visible label text above the field */
  label?: string;
  /** When true, shows a required asterisk in the label */
  required?: boolean;
  /** Helper or validation message shown below the field */
  hint?: string;
  /** Applies validation styling and an icon in the hint */
  validation?: ValidationState;
  /** Classes applied to the outer form-group wrapper */
  className?: string;
  /** Classes merged onto the native select element */
  inputClassName?: string;
}

/**
 * Styled native select with optional label and validation hint.
 * @example
 * <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
 *   <Option value="ca">Canada</Option>
 * </Select>
 */
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

/**
 * Thin wrapper around a native `<option>` for use inside `Select`.
 * @example
 * <Option value="east">East</Option>
 */
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

/**
 * Wraps related controls with shared `form-group` spacing.
 * @example
 * <FormGroup>
 *   <FormLabel htmlFor="user">Username</FormLabel>
 *   <input id="user" className="form-input" />
 * </FormGroup>
 */
export function FormGroup({
  children,
  className = '',
}: {
  /** Group contents (labels, inputs, hints) */
  children: React.ReactNode;
  /** Extra classes appended to `form-group` */
  className?: string;
}) {
  return <div className={`form-group ${className}`}>{children}</div>;
}

/**
 * Stand-alone label using form typography and optional required marker.
 * @example
 * <FormLabel htmlFor="email" required>Work email</FormLabel>
 */
export function FormLabel({
  children,
  required = false,
  htmlFor,
}: {
  /** Label text or elements */
  children: React.ReactNode;
  /** When true, renders the required asterisk */
  required?: boolean;
  /** Associated control id for accessibility */
  htmlFor?: string;
}) {
  return (
    <label className="form-label" htmlFor={htmlFor}>
      {children} {required && <span className="required">*</span>}
    </label>
  );
}

/**
 * Inline helper or validation text with optional status icon.
 * @example
 * <FormHint validation="error">Enter a valid phone number.</FormHint>
 */
export function FormHint({
  children,
  validation,
}: {
  /** Helper or error message content */
  children: React.ReactNode;
  /** Drives icon and color treatment */
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

/**
 * Horizontal row for hints, character counts, and other accessory copy under fields.
 * @example
 * <FormHelperRow>
 *   <FormHint>Optional</FormHint>
 * </FormHelperRow>
 */
export function FormHelperRow({
  children,
}: {
  /** Hint text, counters, or other accessory nodes */
  children: React.ReactNode;
}) {
  return <div className="form-helper-row">{children}</div>;
}

export default Input;
