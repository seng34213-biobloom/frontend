import * as React from 'react';

/**
 * Accessible form field. `FormField` renders the visible label, an optional
 * hint and an optional error, and hands the generated ids to the `Input`,
 * `Select` or `Textarea` inside it through context. The control then gets
 * `id`, `aria-describedby` (hint + error) and `aria-invalid` automatically,
 * so errors are linked to their field and announced (WCAG 1.3.1, 3.3.1).
 */

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

type FormFieldProps = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** Explicit id for the control; generated when omitted. */
  id?: string;
  className?: string;
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean;
  children: React.ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  required = false,
  id,
  className = '',
  hideLabel = false,
  children,
}: FormFieldProps) {
  const generated = React.useId();
  const controlId = id ?? `field-${generated.replace(/:/g, '')}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const value = React.useMemo<FieldContextValue>(
    () => ({ id: controlId, describedBy, invalid: Boolean(error), required }),
    [controlId, describedBy, error, required],
  );

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <label
        htmlFor={controlId}
        className={
          hideLabel
            ? 'sr-only'
            : 'text-forest-600 block text-xs font-semibold uppercase tracking-widest'
        }
      >
        {label}
        {required ? (
          <span className="text-danger-700 ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
      {hint ? (
        <p id={hintId} className="text-forest-500 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger-700 text-xs font-medium">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Reads the surrounding FormField, merging any caller-supplied aria props. */
function useFieldProps<T extends React.AriaAttributes & { id?: string; required?: boolean }>(
  props: T,
): T {
  const ctx = React.useContext(FieldContext);
  if (!ctx) return props;
  const describedBy =
    [ctx.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  return {
    ...props,
    id: props.id ?? ctx.id,
    required: props.required ?? (ctx.required || undefined),
    'aria-describedby': describedBy,
    'aria-invalid': props['aria-invalid'] ?? (ctx.invalid ? true : undefined),
  } as T;
}

/*
 * Control borders use forest-300 (3.7:1 on white, 3.5:1 on cream-50) so the
 * field boundary meets WCAG 1.4.11; invalid fields switch to danger-700.
 */
const controlBase =
  'block w-full rounded-lg border border-forest-300 bg-white px-3 py-2 text-sm text-forest-700 placeholder:text-forest-400 hover:border-forest-500 aria-[invalid=true]:border-danger-700 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-forest-500';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = '', ...props }, ref) {
  const merged = useFieldProps(props);
  return <input ref={ref} className={`${controlBase} ${className}`.trim()} {...merged} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = '', children, ...props }, ref) {
  const merged = useFieldProps(props);
  return (
    <select ref={ref} className={`${controlBase} ${className}`.trim()} {...merged}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = '', rows = 3, ...props }, ref) {
  const merged = useFieldProps(props);
  return (
    <textarea ref={ref} rows={rows} className={`${controlBase} ${className}`.trim()} {...merged} />
  );
});

/** Checkbox with its own label; usable inside or outside a FormField. */
export function Checkbox({
  label,
  hint,
  className = '',
  id,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const generated = React.useId();
  const controlId = id ?? `check-${generated.replace(/:/g, '')}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  return (
    <div className={`flex items-start gap-2 ${className}`.trim()}>
      <input
        id={controlId}
        type="checkbox"
        aria-describedby={hintId}
        className="border-forest-400 text-brand-600 mt-0.5 h-4 w-4 rounded"
        {...props}
      />
      <div>
        <label htmlFor={controlId} className="text-forest-700 text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-forest-500 text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
