import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'border border-black bg-black text-white hover:bg-bark focus-visible:ring-black',
    secondary:
        'border border-black bg-transparent text-black hover:bg-black hover:text-white focus-visible:ring-black',
    ghost: 'bg-transparent text-black underline-offset-4 hover:underline focus-visible:ring-black',
};

export function Button({
    variant = 'primary',
    className = '',
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={`caps inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold leading-none transition-colors duration-100 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`.trim()}
            {...rest}
        >
            {children}
        </button>
    );
}

export default Button;
