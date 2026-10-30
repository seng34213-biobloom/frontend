import * as React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';

/*
 * Flat poster fills with black text and a black hairline, so every pairing
 * stays well above 4.5:1 and the tag shape stays visible (WCAG 1.4.11).
 */
const toneClasses: Record<BadgeTone, string> = {
  success: 'border-black bg-leaf text-black',
  warning: 'border-black bg-sun text-black',
  danger: 'border-black bg-blush text-black',
  neutral: 'border-black bg-cream-50 text-black',
  info: 'border-black bg-[#b9cdee] text-black',
  accent: 'border-black bg-tangerine text-black',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Status tag. Always carries a text label; colour is never the only cue. */
export function Badge({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`caps inline-flex items-center gap-1 whitespace-nowrap border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
