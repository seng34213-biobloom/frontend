'use client';

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const inputClass =
  'block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-danger-500 disabled:bg-cream-100';

export const labelTextClass = 'text-xs font-medium uppercase tracking-widest text-forest-500';

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
        <p id={hintId} className="text-forest-500 mt-1 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger-700 mt-1 text-xs font-semibold">
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
        <p id={hintId} className="text-forest-500 mt-1 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger-700 mt-1 text-xs font-semibold">
          <span aria-hidden="true">! </span>
          {error}
        </p>
      )}
    </div>
  );
}
