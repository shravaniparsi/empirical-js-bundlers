import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash-es';
import clsx from 'clsx';
import { z } from 'zod';
import ImportsNavBar from './ImportsNavBar';
import ImportsDetail1 from './ImportsDetail1';
import ImportsBreadcrumb1 from './ImportsBreadcrumb1';
import styles from './ImportsRangeSlider.module.css';

const ImportsRangeSliderSchema = z.object({
  value: z.string().min(1, 'This field is required').max(255, 'Too long'),
});

interface ImportsRangeSliderProps {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
}

export default function ImportsRangeSlider({
  label,
  name,
  value: controlledValue,
  defaultValue = '',
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  helperText,
  onChange,
  onBlur,
  className,
}: ImportsRangeSliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const displayError = externalError || (touched ? validationError : null);

  const debouncedValidate = useCallback(
    debounce((val: string) => {
      const result = ImportsRangeSliderSchema.safeParse({ value: val });
      setValidationError(result.success ? null : result.error.errors[0]?.message ?? 'Invalid');
    }, 300),
    [required]
  );

  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
      debouncedValidate(newValue);
    },
    [isControlled, onChange, debouncedValidate]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    inputRef.current?.focus();
  }, [isControlled, onChange]);

  const inputId = `${name}-field`;

  return (
    <div className={clsx(styles.fieldWrapper, disabled && styles.disabled, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <div className={clsx(styles.inputContainer, displayError && styles.hasError)}>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="password"
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.input}
        />

        {currentValue && !disabled && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear field"
          >
            ×
          </button>
        )}
      </div>

      {(displayError || helperText) && (
        <span className={clsx(styles.hint, displayError && styles.errorText)}>
          {displayError || helperText}
        </span>
      )}

      <div className={styles.related}>
      <ImportsNavBar />
      <ImportsDetail1 />
      <ImportsBreadcrumb1 />
      </div>
    </div>
  );
}
