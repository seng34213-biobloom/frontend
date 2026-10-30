'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Page heading block. Also sets the document title, since client pages
 * cannot export metadata (WCAG 2.4.2 Page Titled).
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} · Bio Bloom Admin`;
  }, [title]);

  return (
    <header className="flex flex-col gap-4 border-b border-black pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="caps text-xs font-medium">{eyebrow}</p> : null}
        <h1 className="font-serif text-3xl">{title}</h1>
        {description ? <div className="max-w-2xl text-sm">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
