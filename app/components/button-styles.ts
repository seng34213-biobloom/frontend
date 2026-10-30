/**
 * Class names matching `@biobloom/ui` Button, for elements that cannot be
 * that component (links, buttons that need a ref). Disabled controls keep a
 * visible dashed outline instead of fading out (WCAG 1.4.11).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'action' | 'cta';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-black bg-black text-white hover:bg-bark',
  secondary: 'border border-black bg-transparent text-black hover:bg-black hover:text-white',
  ghost: 'bg-transparent text-black underline-offset-4 hover:underline',
  action: 'border border-black bg-ocean text-white hover:bg-black',
  cta: 'rounded-cta border border-black bg-tangerine text-black hover:bg-sun',
};

export function buttonClass(variant: ButtonVariant = 'primary', extra = ''): string {
  return `caps inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold leading-none transition-colors duration-100 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-forest-500 disabled:bg-cream-100 disabled:text-forest-500 ${variantClasses[variant]} ${extra}`.trim();
}
