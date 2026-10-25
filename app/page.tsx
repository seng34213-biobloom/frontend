import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HeroCarousel } from './components/hero-carousel';
import { ProductCard } from './components/product-card';
import { BundleCard } from './components/bundle-card';
import { ButtonLink } from './components/button-link';
import { serverGetOptional } from './lib/server-api';
import { bundleList } from './lib/bundles';
import type { Bundle, ProductPage } from './lib/types';

const FEATURED_CATEGORIES = [
  { key: 'jams', href: '/products?category=jams', icon: '🍓' },
  { key: 'chilliSauces', href: '/products?search=chilli', icon: '🌶️' },
  { key: 'giftBoxes', href: '/bundles', icon: '🎁' },
  { key: 'subscribe', href: '/products', icon: '↻' },
] as const;

const TRUST_BADGES = [
  { key: 'handmade', icon: '✋' },
  { key: 'fifo', icon: '📅' },
  { key: 'local', icon: '🌿' },
  { key: 'secure', icon: '🔒' },
] as const;

/**
 * Customer homepage (SDS §6.1): hero carousel, featured categories, featured
 * products (4 columns desktop / 2 mobile), gift boxes, shipping callout and
 * trust badges. Data sections degrade to a friendly message when the API is
 * unreachable so the homepage itself never fails.
 */
export default async function HomePage() {
  const t = await getTranslations('home');
  const [products, bundlesPayload] = await Promise.all([
    serverGetOptional<ProductPage>('/api/products?pageSize=8'),
    serverGetOptional<Bundle[] | { items: Bundle[] }>('/api/bundles'),
  ]);
  const bundles = bundleList(bundlesPayload).slice(0, 3);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="sr-only">{t('title')}</h1>
      <HeroCarousel />

      <section aria-labelledby="home-categories" className="space-y-6">
        <h2 id="home-categories" className="text-forest-700 font-serif text-3xl">
          {t('categoriesHeading')}
        </h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {FEATURED_CATEGORIES.map((c) => (
            <li key={c.key}>
              <Link
                href={c.href}
                className="border-cream-200 bg-cream-50 ease-soft flex h-full flex-col gap-3 rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <span aria-hidden="true" className="text-3xl">
                  {c.icon}
                </span>
                <span className="text-forest-700 font-serif text-xl">
                  {t(`categories.${c.key}.title`)}
                </span>
                <span className="text-forest-500 text-sm">{t(`categories.${c.key}.body`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-featured" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="home-featured" className="text-forest-700 font-serif text-3xl">
            {t('featuredHeading')}
          </h2>
          <Link
            href="/products"
            className="text-brand-700 hover:text-brand-800 rounded-sm text-sm font-semibold"
          >
            {t('viewAll')} <span aria-hidden="true">→</span>
          </Link>
        </div>
        {products === null ? (
          <p
            role="status"
            className="border-cream-300 bg-cream-100 text-forest-600 rounded-2xl border p-5 text-sm"
          >
            {t('featuredUnavailable')}
          </p>
        ) : products.items.length === 0 ? (
          <p className="text-forest-500">{t('featuredEmpty')}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {products.items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} headingLevel="h3" compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      {bundles.length > 0 && (
        <section aria-labelledby="home-bundles" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 id="home-bundles" className="text-forest-700 font-serif text-3xl">
                {t('bundlesHeading')}
              </h2>
              <p className="text-forest-500">{t('bundlesLead')}</p>
            </div>
            <Link
              href="/bundles"
              className="text-brand-700 hover:text-brand-800 rounded-sm text-sm font-semibold"
            >
              {t('viewAllBundles')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {bundles.map((b) => (
              <li key={b.id}>
                <BundleCard bundle={b} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="home-shipping"
        className="border-brand-200 bg-brand-50 flex flex-col gap-5 rounded-3xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="space-y-2">
          <h2 id="home-shipping" className="text-forest-700 font-serif text-2xl">
            {t('shippingHeading')}
          </h2>
          <p className="text-forest-600 max-w-2xl">{t('shippingBody')}</p>
        </div>
        <ButtonLink href="/products" className="shrink-0">
          {t('shippingCta')}
        </ButtonLink>
      </section>

      <section aria-labelledby="home-trust" className="space-y-6">
        <h2 id="home-trust" className="text-forest-700 font-serif text-3xl">
          {t('trustHeading')}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((b) => (
            <li
              key={b.key}
              className="border-cream-200 bg-cream-50 flex gap-4 rounded-3xl border p-5"
            >
              <span
                aria-hidden="true"
                className="border-clay-300 bg-clay-100 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed text-xl"
              >
                {b.icon}
              </span>
              <span className="space-y-1">
                <span className="text-forest-700 block font-semibold">
                  {t(`trust.${b.key}.title`)}
                </span>
                <span className="text-forest-500 block text-sm">{t(`trust.${b.key}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
