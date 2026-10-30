import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-black bg-black text-white hover:bg-bark focus-visible:ring-black',
  secondary:
    'border border-black bg-transparent text-black hover:bg-black hover:text-white focus-visible:ring-black',
  ghost: 'bg-transparent text-black underline-offset-4 hover:underline focus-visible:ring-black',
  danger:
    'border border-danger-700 bg-danger-700 text-white hover:bg-danger-900 focus-visible:ring-danger-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-6 py-3.5 text-sm',
};

/*
 * WCAG 1.4.11: disabled controls keep a visible boundary. Instead of fading
 * the button with opacity (which dropped it below 3:1 against the cream
 * background) the disabled state swaps to a neutral fill with a dashed
 * forest-400 outline (5:1 against cream-100) and forest-500 text.
 */
const disabledClasses =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-cream-100 disabled:text-forest-500 disabled:outline-dashed disabled:outline-1 disabled:outline-offset-0 disabled:outline-forest-400 disabled:hover:bg-cream-100';

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
  return `caps inline-flex items-center justify-center gap-2 rounded-none font-semibold leading-none transition-colors duration-100 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`.trim();
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
