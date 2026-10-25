import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { bundleAvailability, bundleComponents } from '../../../lib/bundles';
import { serverGet } from '../../../lib/server-api';
import type { Bundle } from '../../../lib/types';
import { AddBundleToCart } from './add-to-cart';

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await serverGet<Bundle>(`/api/bundles/${encodeURIComponent(slug)}`);
  if (!bundle) notFound();
  const t = await getTranslations('bundles');
  const available = bundleAvailability(bundle) ?? 0;
  const saving = bundle.componentsTotal ? Number(bundle.componentsTotal) - Number(bundle.price) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <nav className="text-sm" aria-label={t('breadcrumb')}>
        <Link href="/bundles" className="text-brand-700 hover:text-brand-900 font-medium">
          <span aria-hidden="true">←</span> {t('heading')}
        </Link>
      </nav>
      <header className="space-y-2">
        <span className="bg-clay-100 text-clay-500 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest">
          {t('badge')}
        </span>
        <h1 className="text-forest-700 font-serif text-4xl">{bundle.name}</h1>
        {bundle.seller ? (
          <p className="text-forest-500 text-sm">{bundle.seller.businessName}</p>
        ) : null}
        <p className="text-forest-600 text-lg">{bundle.description}</p>
      </header>
      <section
        aria-labelledby="contents-h"
        className="border-cream-200 rounded-3xl border bg-white p-6"
      >
        <h2 id="contents-h" className="font-semibold">
          {t('contains')}
        </h2>
        <ul className="mt-3 space-y-1">
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
        <p className="mt-4 text-3xl font-semibold">LKR {bundle.price}</p>
        {saving > 0 ? (
          <p className="text-brand-700 text-sm">{t('saving', { amount: saving.toFixed(2) })}</p>
        ) : null}
        <p className="text-forest-600 text-sm">{t('weight', { grams: bundle.totalWeightG })}</p>
        <AddBundleToCart bundleId={bundle.id} slug={bundle.slug} available={available} />
      </section>
    </div>
  );
}
