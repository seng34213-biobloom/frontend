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
    'inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition-colors';

  return (
    <nav aria-label={t('label')} className="flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className={`${item} border-cream-300 text-forest-700 hover:bg-cream-100`}
            >
              <span aria-hidden="true">←</span> {t('previous')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${item} border-forest-500 text-forest-500 border-dashed`}
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
              className={`${item} ${p === page ? 'border-brand-600 bg-brand-600 text-cream-50' : 'border-cream-300 text-forest-700 hover:bg-cream-100'}`}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link
              href={href(page + 1)}
              className={`${item} border-cream-300 text-forest-700 hover:bg-cream-100`}
            >
              {t('next')} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${item} border-forest-500 text-forest-500 border-dashed`}
            >
              {t('next')} <span aria-hidden="true">→</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
