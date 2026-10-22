import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-brand-600 text-cream-50 shadow-sm hover:bg-brand-700 hover:shadow-md focus-visible:ring-brand-500',
    secondary:
        'border border-forest-700/15 bg-cream-50 text-forest-700 hover:border-forest-700/30 hover:bg-cream-100 focus-visible:ring-brand-500',
    ghost:
        'bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500',
};

export function Button({
    variant = 'primary',
    className = '',
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-sm ${variantClasses[variant]} ${className}`.trim()}
            {...rest}
        >
            {children}
        </button>
    );
}

export default Button;
