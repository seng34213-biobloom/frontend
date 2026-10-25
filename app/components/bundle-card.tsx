import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Bundle } from '../lib/types';
import { bundleAvailability, bundleComponents } from '../lib/bundles';

/** Gift box tile (SDS §1.2 product flexibility, §6.1 featured bundles). */
export function BundleCard({
  bundle,
  headingLevel = 'h2',
}: {
  bundle: Bundle;
  headingLevel?: 'h2' | 'h3';
}) {
  const t = useTranslations('bundles');
  const common = useTranslations('common');
  const Heading = headingLevel;
  const parts = bundleComponents(bundle);
  const available = bundleAvailability(bundle);

  return (
    <Link
      href={`/bundles/${bundle.slug}`}
      className="border-cream-200 bg-cream-50 ease-soft group flex h-full flex-col gap-4 rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <span className="bg-clay-100 text-clay-500 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest">
        <span aria-hidden="true">🎁</span>
        {t('badge')}
      </span>
      <Heading className="text-forest-700 group-hover:text-brand-700 break-words font-serif text-2xl">
        {bundle.name}
      </Heading>
      <p className="text-forest-500 text-sm leading-relaxed">{bundle.description}</p>
      {parts.length > 0 && (
        <p className="text-forest-500 text-xs">{t('contains', { count: parts.length })}</p>
      )}
      <div className="border-cream-200 mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <span className="text-forest-700 text-lg font-bold">
          {common('price', { amount: bundle.price })}
        </span>
        {available === 0 ? (
          <span className="text-danger-700 text-xs font-semibold">{t('soldOut')}</span>
        ) : (
          <span className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold">
            {t('view')}
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </Link>
  );
}
