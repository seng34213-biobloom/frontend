import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StarRating } from '../../../components/star-rating';
import { serverGet, serverGetOptional } from '../../../lib/server-api';
import type { ProductDetail, Review } from '../../../lib/types';
import { ProductGallery } from './product-gallery';
import { ProductTabs } from './product-tabs';
import { ReviewsSection } from './reviews-section';
import { VariantPanel } from './variant-panel';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverGetOptional<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
  return product
    ? { title: `${product.name} — Bio Bloom`, description: product.description.slice(0, 160) }
    : {};
}

/**
 * Product Detail Page (SDS §6.2). Server-rendered for SEO: gallery,
 * description, Ingredients & Allergens and Customer Reviews tabs. The
 * variant selector, live stock indicator and Subscribe & Save toggle are the
 * client `VariantPanel`. Unknown slugs render not-found.tsx; an unreachable
 * API throws and renders the route's error state.
 */
export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await serverGet<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
  if (!product) notFound();
  const t = await getTranslations('pdp');
  const reviews = (await serverGetOptional<Review[]>(`/api/products/${product.id}/reviews`)) ?? [];
  const rating = product.rating ?? { average: null, count: reviews.length };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <nav className="text-sm" aria-label={t('breadcrumb')}>
        <Link href="/products" className="text-brand-700 hover:text-brand-900 font-medium">
          <span aria-hidden="true">←</span> {t('allProducts')}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery name={product.name} images={product.images ?? []} />

        <div className="flex flex-col gap-8">
          <header className="space-y-3">
            <span className="bg-clay-100 text-clay-500 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              {product.category}
            </span>
            <h1 className="text-forest-700 font-serif text-4xl md:text-5xl">{product.name}</h1>
            <p className="text-forest-500 text-sm font-medium">
              {t('bySeller', { seller: product.seller.businessName })}
            </p>
            {rating.count > 0 && rating.average !== null ? (
              <p className="text-forest-600 flex items-center gap-2 text-sm">
                <StarRating value={Number(rating.average)} />
                <span>{t('reviewCount', { count: rating.count })}</span>
              </p>
            ) : null}
          </header>

          <VariantPanel
            productSlug={product.slug}
            productName={product.name}
            variants={product.variants}
            stockByVariant={product.stockByVariant}
            earliestExpiryByVariant={product.earliestExpiryByVariant}
          />
        </div>
      </div>

      <ProductTabs
        reviewCount={rating.count}
        description={
          <p className="text-forest-600 max-w-3xl whitespace-pre-line text-lg leading-relaxed">
            {product.description}
          </p>
        }
        ingredients={
          <dl className="max-w-3xl space-y-4">
            <div>
              <dt className="font-semibold">{t('ingredients')}</dt>
              <dd className="text-forest-600 whitespace-pre-line">
                {product.ingredients || t('noIngredients')}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">{t('allergens')}</dt>
              <dd className="text-forest-600 whitespace-pre-line">
                {product.allergens || t('noAllergens')}
              </dd>
            </div>
          </dl>
        }
        reviews={<ReviewsSection productId={product.id} initial={reviews} />}
      />
    </div>
  );
}
