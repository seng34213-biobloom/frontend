/**
 * Class names matching `@biobloom/ui` Button, for elements that cannot be
 * that component (links, buttons that need a ref). Disabled controls keep a
 * visible dashed outline instead of fading out (WCAG 1.4.11).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-cream-50 shadow-sm hover:bg-brand-700 hover:shadow-md',
  secondary:
    'border border-forest-700/15 bg-cream-50 text-forest-700 hover:border-forest-700/30 hover:bg-cream-100',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
};

export function buttonClass(variant: ButtonVariant = 'primary', extra = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-forest-500 disabled:bg-cream-100 disabled:text-forest-500 disabled:shadow-none disabled:active:scale-100 ${variantClasses[variant]} ${extra}`.trim();
}
