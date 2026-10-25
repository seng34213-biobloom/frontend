import Link from 'next/link';
import type { ComponentProps } from 'react';
import { buttonClass, type ButtonVariant } from './button-styles';

/**
 * A link styled like `@biobloom/ui` Button. Use it for navigation instead of
 * wrapping a Link in a Button, which nests two interactive elements
 * (WCAG 4.1.2).
 */
export function ButtonLink({
  variant = 'primary',
  className = '',
  ...rest
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
