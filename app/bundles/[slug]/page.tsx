import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ProductArtGroup } from '../../components/product-art';
import { bundleAvailability, bundleComponents } from '../../lib/bundles';
import { serverGet } from '../../lib/server-api';
import type { Bundle } from '../../lib/types';
import { AddBundleToCart } from './add-to-cart';

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await serverGet<Bundle>(`/api/bundles/${encodeURIComponent(slug)}`);
  if (!bundle) notFound();
  const t = await getTranslations('bundles');
  const available = bundleAvailability(bundle) ?? 0;
  const saving = bundle.componentsTotal ? Number(bundle.componentsTotal) - Number(bundle.price) : 0;

  return (
    <div className="band grid grid-cols-1 lg:grid-cols-[1fr_2fr]">
      <div
        aria-hidden="true"
        className="aspect-[10/9] border-b border-black bg-white lg:sticky lg:top-[5.5rem] lg:border-b-0 lg:border-r"
      >
        <ProductArtGroup names={bundleComponents(bundle).map((c) => c.productName)} />
      </div>
      <div className="min-w-0">
        <div className="space-y-4 p-7">
          <nav className="text-sm" aria-label={t('breadcrumb')}>
            <Link href="/bundles" className="caps font-medium hover:underline">
              <span aria-hidden="true">←</span> {t('heading')}
            </Link>
          </nav>
          <header className="space-y-2">
            <h1 className="font-serif text-3xl md:text-4xl">{bundle.name}</h1>
            {bundle.seller ? <p>{bundle.seller.businessName}</p> : null}
            <p>{bundle.description}</p>
          </header>
          <p className="text-lg">LKR {bundle.price}</p>
          {saving > 0 ? (
            <p className="text-sm font-medium">{t('saving', { amount: saving.toFixed(2) })}</p>
          ) : null}
          <p className="text-sm">{t('weight', { grams: bundle.totalWeightG })}</p>
          <AddBundleToCart bundleId={bundle.id} slug={bundle.slug} available={available} />
        </div>
        <section aria-labelledby="contents-h" className="border-t border-black">
          <h2 id="contents-h" className="caps border-b border-black px-7 py-6">
            {t('contains', { count: bundleComponents(bundle).length })}
          </h2>
          <ul className="space-y-1 px-7 py-6">
            {bundleComponents(bundle).map((c) => (
              <li key={c.key}>
                {c.quantity} ×{' '}
                {c.productSlug ? (
                  <Link href={`/products/${c.productSlug}`} className="underline">
                    {c.productName}
                  </Link>
                ) : (
                  c.productName
                )}{' '}
                ({c.variantLabel})
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
