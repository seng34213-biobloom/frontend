import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Bundle } from '../lib/types';
import { bundleAvailability, bundleComponents } from '../lib/bundles';
import { ProductArtGroup } from './product-art';

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
  const href = `/bundles/${bundle.slug}`;

  return (
    <article className="group relative flex h-full flex-col">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[10/9] border-b border-black bg-white"
      >
        <ProductArtGroup names={parts.map((p) => p.productName)} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-7">
        <Heading className="break-words font-serif text-base">
          <Link href={href} className="hover:underline">
            {bundle.name}
          </Link>
        </Heading>
        <p className="text-sm">{bundle.description}</p>
        {parts.length > 0 && <p className="text-sm">{t('contains', { count: parts.length })}</p>}
        <p className="mt-auto font-medium">{common('price', { amount: bundle.price })}</p>
      </div>
      <Link
        href={href}
        className="caps flex w-full items-center justify-around gap-3 bg-black px-3 py-4 text-sm font-light text-white transition-opacity duration-100 hover:bg-bark [@media(hover:hover)]:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <span>{common('price', { amount: bundle.price })}</span>
        <span>{available === 0 ? t('soldOut') : t('view')}</span>
      </Link>
    </article>
  );
}
