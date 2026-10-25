import { getTranslations } from 'next-intl/server';

/**
 * Cosmetic loading skeleton for the catalogue route. Shown by Next.js during
 * navigation/streaming only — no data fetching or behaviour of its own.
 */
export default async function ProductsLoading() {
  const t = await getTranslations('common');
  return (
    <div
      className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <div className="max-w-2xl space-y-4">
        <div className="skeleton h-7 w-20 rounded-full" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-5 w-5/6" />
      </div>

      <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="border-cream-200 bg-cream-50 flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm"
          >
            <div className="skeleton aspect-[5/4] rounded-none" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-4/5" />
              <div className="border-cream-200 mt-4 flex items-center justify-between border-t pt-4">
                <div className="skeleton h-7 w-24" />
                <div className="skeleton h-5 w-14" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
