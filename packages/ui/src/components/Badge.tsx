import * as React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';

/*
 * Every pairing keeps text at >= 4.5:1 against its fill and a 1px border at
 * >= 3:1 against the page so the pill shape stays visible (WCAG 1.4.11).
 */
const toneClasses: Record<BadgeTone, string> = {
  success: 'border-brand-500 bg-brand-100 text-brand-800',
  warning: 'border-amber-600 bg-amber-100 text-amber-700',
  danger: 'border-danger-500 bg-danger-50 text-danger-700',
  neutral: 'border-forest-300 bg-cream-100 text-forest-600',
  info: 'border-brand-500 bg-brand-50 text-brand-700',
  accent: 'border-clay-400 bg-clay-100 text-clay-500',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Status pill. Always carries a text label; colour is never the only cue. */
export function Badge({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
