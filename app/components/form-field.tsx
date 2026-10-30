'use client';

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { inputClass, labelTextClass } from './form-styles';

interface FieldChrome {
  label: string;
  hint?: string;
  error?: string | null;
}

/**
 * Labelled input with its hint and error linked through aria-describedby
 * (WCAG 1.3.1, 3.3.1). The error is shown as text, not colour alone.
 */
export function TextField({
  label,
  hint,
  error,
  id,
  className = '',
  ...rest
}: FieldChrome & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelTextClass}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass} mt-1.5`}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger-700 mt-1 text-sm font-semibold">
          <span aria-hidden="true">! </span>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className = '',
  ...rest
}: FieldChrome & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelTextClass}>
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass} mt-1.5 min-h-28`}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger-700 mt-1 text-sm font-semibold">
          <span aria-hidden="true">! </span>
          {error}
        </p>
      )}
    </div>
  );
}
