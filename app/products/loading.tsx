import { getTranslations } from 'next-intl/server';

/**
 * Cosmetic loading skeleton for the catalogue route. Shown by Next.js during
 * navigation/streaming only — no data fetching or behaviour of its own.
 */
export default async function ProductsLoading() {
  const t = await getTranslations('common');
  return (
    <div aria-busy="true" aria-label={t('loading')}>
      <div className="band p-7">
        <div className="skeleton h-8 w-48" />
      </div>
      <ul className="ruled-grid grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex h-full flex-col">
            <div className="skeleton aspect-[10/13] border-b border-black" />
            <div className="flex flex-1 flex-col gap-3 p-7">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-5 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
