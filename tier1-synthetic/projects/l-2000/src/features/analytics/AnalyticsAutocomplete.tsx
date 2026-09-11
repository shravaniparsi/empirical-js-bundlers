import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash-es';
import clsx from 'clsx';
import { z } from 'zod';
import AnalyticsScatter2 from './AnalyticsScatter2';
import AnalyticsRating from './AnalyticsRating';
import styles from './AnalyticsAutocomplete.module.css';

const AnalyticsAutocompleteSchema = z.object({
  value: z.string().min(1, 'This field is required').max(255, 'Too long'),
});

interface AnalyticsAutocompleteProps {
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

export default function AnalyticsAutocomplete({
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
}: AnalyticsAutocompleteProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLSelectElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const displayError = externalError || (touched ? validationError : null);

  const debouncedValidate = useCallback(
    debounce((val: string) => {
      const result = AnalyticsAutocompleteSchema.safeParse({ value: val });
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
    (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        <select
          ref={inputRef}
          id={inputId}
          name={name}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.input}
        >
          <option value="">{placeholder || 'Select...'}</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>

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
      <AnalyticsScatter2 />
      <AnalyticsRating />
      </div>
    </div>
  );
}
