import * as React from 'react';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './Button';

type LinkButtonProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Link component to render, e.g. Next.js `Link` for client-side routing.
   * Defaults to a plain `<a>`.
   */
  as?: React.ElementType;
};

/**
 * A navigation link styled as a button. Use this instead of nesting an `<a>`
 * inside a `<button>` (invalid interactive nesting, WCAG 4.1.2).
 */
export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'a',
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Component href={href} className={buttonClassName({ variant, size, className })} {...rest}>
      {children}
    </Component>
  );
}
