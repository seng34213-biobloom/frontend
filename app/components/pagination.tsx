import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** Numbered pagination that keeps the current filters in the query string. */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const t = useTranslations('pagination');
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set('page', String(p));
    else qs.delete('page');
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  const item =
    'inline-flex min-w-11 items-center justify-center border px-3.5 py-2.5 text-sm font-medium';

  return (
    <nav aria-label={t('label')} className="band flex justify-center p-7">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} className={`${item} hover:bg-sun border-black text-black`}>
              <span aria-hidden="true">←</span> {t('previous')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${item} border-dashed border-forest-400 text-forest-400`}
            >
              <span aria-hidden="true">←</span> {t('previous')}
            </span>
          )}
        </li>
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-2">
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span aria-hidden="true" className="text-forest-500">
                …
              </span>
            )}
            <Link
              href={href(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={t('page', { n: p })}
              className={`${item} ${p === page ? 'border-black bg-black text-white' : 'hover:bg-sun border-black text-black'}`}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link href={href(page + 1)} className={`${item} hover:bg-sun border-black text-black`}>
              {t('next')} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${item} border-dashed border-forest-400 text-forest-400`}
            >
              {t('next')} <span aria-hidden="true">→</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
