import type { ReactNode } from 'react';

/**
 * Title band at the top of every page: the heading sits on the page's first
 * ruled band, with the optional lead beneath it.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="band space-y-2 px-7 py-6">
      {eyebrow && <p className="caps text-sm">{eyebrow}</p>}
      <h1 className="break-words font-serif text-3xl md:text-4xl">{title}</h1>
      {lead && <p className="max-w-3xl">{lead}</p>}
      {children}
    </header>
  );
}
