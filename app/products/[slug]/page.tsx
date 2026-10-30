import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StarRating } from '../../components/star-rating';
import { categoryLabel } from '../../lib/categories';
import { serverGet, serverGetOptional } from '../../lib/server-api';
import type { ProductDetail, Review } from '../../lib/types';
import { ProductGallery } from './product-gallery';
import { ProductAccordions } from './product-accordions';
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
 * description, Ingredients & Allergens accordions and Customer Reviews. The
 * variant selector, live stock indicator and Subscribe & Save toggle are the
 * client `VariantPanel`. Unknown slugs render not-found.tsx; an unreachable
 * API throws and renders the route's error state.
 */
export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await serverGet<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
  if (!product) notFound();
  const t = await getTranslations('pdp');
  const tCategory = await getTranslations('categories');
  const reviews = (await serverGetOptional<Review[]>(`/api/products/${product.id}/reviews`)) ?? [];
  const rating = product.rating ?? { average: null, count: reviews.length };

  return (
    <div>
      <div className="band grid grid-cols-1 lg:grid-cols-[1fr_2fr]">
        <div className="border-b border-black lg:border-b-0 lg:border-r">
          <ProductGallery
            name={product.name}
            category={product.category}
            images={product.images ?? []}
          />
        </div>

        <div className="min-w-0">
          <div className="space-y-4 p-7">
            <nav className="text-sm" aria-label={t('breadcrumb')}>
              <Link href="/products" className="caps font-medium hover:underline">
                {t('allProducts')}
              </Link>
            </nav>
            <header className="space-y-2">
              <h1 className="font-serif text-3xl md:text-4xl">{product.name}</h1>
              <p>
                {t('bySeller', { seller: product.seller.businessName })} ·{' '}
                {categoryLabel(tCategory, product.category)}
              </p>
              {rating.count > 0 && rating.average !== null ? (
                <p className="flex items-center gap-2">
                  <StarRating value={Number(rating.average)} />
                  <span>{t('reviewCount', { count: rating.count })}</span>
                </p>
              ) : null}
            </header>
            <p className="whitespace-pre-line">{product.description}</p>
          </div>

          <VariantPanel
            productSlug={product.slug}
            productName={product.name}
            variants={product.variants}
            stockByVariant={product.stockByVariant}
            earliestExpiryByVariant={product.earliestExpiryByVariant}
          />

          <ProductAccordions
            ingredients={
              <p className="whitespace-pre-line">{product.ingredients || t('noIngredients')}</p>
            }
            allergens={
              <p className="whitespace-pre-line">{product.allergens || t('noAllergens')}</p>
            }
          />
        </div>
      </div>

      <ReviewsSection productId={product.id} initial={reviews} count={rating.count} />
    </div>
  );
}
