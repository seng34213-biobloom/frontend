'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isConsolePath } from '../lib/admin/nav';

/**
 * Storefront chrome (skip link, header, the page's single `<main>`, footer).
 * Admin console routes render bare so the console's sidebar layout is the
 * only shell on the page.
 */
export function StorefrontFrame({
  skipLink,
  header,
  footer,
  children,
}: {
  skipLink: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  if (isConsolePath(pathname)) return <>{children}</>;
  return (
    <>
      {skipLink}
      {header}
      {/* The only <main> on every page; pages render sections inside it. */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {footer}
    </>
  );
}
