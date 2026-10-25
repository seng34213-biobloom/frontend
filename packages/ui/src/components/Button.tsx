import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-cream-50 shadow-sm hover:bg-brand-700 hover:shadow-md focus-visible:ring-brand-500',
  secondary:
    'border border-forest-300 bg-cream-50 text-forest-700 hover:border-forest-500 hover:bg-cream-100 focus-visible:ring-brand-500',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500',
  danger:
    'bg-danger-700 text-cream-50 shadow-sm hover:bg-danger-900 hover:shadow-md focus-visible:ring-danger-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
};

/*
 * WCAG 1.4.11: disabled controls keep a visible boundary. Instead of fading
 * the button with opacity (which dropped it below 3:1 against the cream
 * background) the disabled state swaps to a neutral fill with a dashed
 * forest-400 outline (5:1 against cream-100) and forest-500 text.
 */
const disabledClasses =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-cream-100 disabled:text-forest-500 disabled:shadow-none disabled:outline-dashed disabled:outline-1 disabled:outline-offset-0 disabled:outline-forest-400 disabled:hover:bg-cream-100 disabled:hover:shadow-none disabled:active:scale-100';

/** Class list shared by `Button` and `LinkButton` so both look identical. */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 active:scale-[0.98] ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`.trim();
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buttonClassName({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
});
