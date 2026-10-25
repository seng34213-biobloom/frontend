import type { ReactNode } from 'react';

/** Eyebrow chip + display heading + optional lead, used at the top of every page. */
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
    <header className="max-w-2xl space-y-4">
      {eyebrow && (
        <span className="border-cream-300 bg-cream-50 text-clay-500 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
          <span aria-hidden="true" className="bg-brand-500 h-1.5 w-1.5 rounded-full" />
          {eyebrow}
        </span>
      )}
      <h1 className="text-forest-700 break-words font-serif text-4xl md:text-5xl">{title}</h1>
      {lead && <p className="text-forest-500 text-lg leading-relaxed">{lead}</p>}
      {children}
    </header>
  );
}
