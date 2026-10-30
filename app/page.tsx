import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HeroCarousel } from './components/hero-carousel';
import { ProductCard } from './components/product-card';
import { BundleCard } from './components/bundle-card';
import { serverGetOptional } from './lib/server-api';
import { bundleList } from './lib/bundles';
import type { Bundle, ProductPage } from './lib/types';

const FEATURED_CATEGORIES = [
  { key: 'jams', href: '/products?category=jams', tone: 'bg-sun' },
  { key: 'chilliSauces', href: '/products?search=chilli', tone: 'bg-bubblegum' },
  { key: 'giftBoxes', href: '/bundles', tone: 'bg-tangerine' },
  { key: 'subscribe', href: '/products', tone: 'bg-leaf' },
] as const;

const TRUST_BADGES = ['handmade', 'fifo', 'local', 'secure'] as const;

/**
 * Customer homepage (SDS §6.1), a stack of full-bleed ruled bands: shipping
 * ticker, hero carousel, featured products (4 columns desktop / 2 mobile),
 * categories, gift boxes, shipping callout and trust badges. Data sections
 * degrade to a friendly message when the API is unreachable so the homepage
 * itself never fails.
 */
export default async function HomePage() {
  const t = await getTranslations('home');
  const [products, bundlesPayload] = await Promise.all([
    serverGetOptional<ProductPage>('/api/products?pageSize=8'),
    serverGetOptional<Bundle[] | { items: Bundle[] }>('/api/bundles'),
  ]);
  const bundles = bundleList(bundlesPayload).slice(0, 3);

  return (
    <div className="overflow-hidden">
      <h1 className="sr-only">{t('title')}</h1>

      <p className="band bg-blush px-5 py-3 text-center text-[1.05em] font-medium md:text-xl">
        {t('shippingHeading')}
      </p>

      <HeroCarousel />

      <section aria-labelledby="home-featured">
        <div className="band flex flex-wrap items-center justify-between gap-3 px-7 py-6">
          <h2 id="home-featured" className="caps text-lg font-light">
            {t('featuredHeading')}
          </h2>
          <Link href="/products" className="caps text-sm font-medium hover:underline">
            {t('viewAll')} <span aria-hidden="true">→</span>
          </Link>
        </div>
        {products === null ? (
          <p role="status" className="band p-7">
            {t('featuredUnavailable')}
          </p>
        ) : products.items.length === 0 ? (
          <p className="band p-7">{t('featuredEmpty')}</p>
        ) : (
          <ul className="ruled-grid grid-cols-2 lg:grid-cols-4">
            {products.items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="home-shipping" className="band bg-sun px-7 py-8 text-center">
        <h2 id="home-shipping" className="text-lg font-medium">
          {t('shippingHeading')}
        </h2>
        <p className="mx-auto mt-3 max-w-4xl text-lg">{t('shippingBody')}</p>
        <Link
          href="/products"
          className="caps bg-bark hover:bg-black mt-7 inline-block border border-black px-7 py-4 text-sm font-semibold leading-none text-white"
        >
          {t('shippingCta')}
        </Link>
      </section>

      <section aria-labelledby="home-categories">
        <h2 id="home-categories" className="band bg-sky px-7 py-1 text-center text-lg font-light">
          {t('categoriesHeading')}
        </h2>
        <ul className="ruled-grid grid-cols-2 lg:grid-cols-4">
          {FEATURED_CATEGORIES.map((c) => (
            <li key={c.key} className={c.tone}>
              <Link href={c.href} className="block h-full p-7 hover:underline">
                <span className="block font-serif text-2xl">{t(`categories.${c.key}.title`)}</span>
                <span className="mt-2 block">{t(`categories.${c.key}.body`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {bundles.length > 0 && (
        <section aria-labelledby="home-bundles">
          <div className="band flex flex-wrap items-center justify-between gap-3 px-7 py-6">
            <div>
              <h2 id="home-bundles" className="caps text-lg font-light">
                {t('bundlesHeading')}
              </h2>
              <p>{t('bundlesLead')}</p>
            </div>
            <Link href="/bundles" className="caps text-sm font-medium hover:underline">
              {t('viewAllBundles')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="ruled-grid grid-cols-1 md:grid-cols-3">
            {bundles.map((b) => (
              <li key={b.id}>
                <BundleCard bundle={b} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="home-trust">
        <h2 id="home-trust" className="band bg-sky px-7 py-1 text-center text-lg font-light">
          {t('trustHeading')}
        </h2>
        <ul className="ruled-grid grid-cols-1 md:grid-cols-2">
          {TRUST_BADGES.map((key) => (
            <li key={key} className="px-7 py-10 text-center">
              <p className="mx-auto max-w-md">
                <span className="block font-semibold">{t(`trust.${key}.title`)}</span>
                <span className="mt-3 block">{t(`trust.${key}.body`)}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
