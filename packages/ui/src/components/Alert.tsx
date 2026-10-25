import * as React from 'react';

export type AlertTone = 'error' | 'warning' | 'success' | 'info';

const toneClasses: Record<AlertTone, string> = {
  error: 'border-danger-300 bg-danger-50 text-danger-700',
  warning: 'border-amber-400 bg-amber-50 text-amber-700',
  success: 'border-brand-300 bg-brand-50 text-brand-700',
  info: 'border-cream-300 bg-cream-100 text-forest-600',
};

const tonePrefix: Record<AlertTone, string> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Note',
};

type AlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: AlertTone;
  title?: React.ReactNode;
};

/**
 * Inline message. Errors use `role="alert"` (assertive) and everything else
 * `role="status"` (polite), so changes are announced (WCAG 4.1.3). The tone
 * is also spelled out in text so colour is never the only cue (1.4.1).
 */
export function Alert({ tone = 'info', title, className = '', children, ...rest }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border p-3 text-sm ${toneClasses[tone]} ${className}`.trim()}
      {...rest}
    >
      {title ? (
        <p className="font-semibold">
          <span className="sr-only">{tonePrefix[tone]}: </span>
          {title}
        </p>
      ) : (
        <span className="sr-only">{tonePrefix[tone]}: </span>
      )}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}
