import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ProductListItem } from '../lib/types';
import { lowestPrice } from '../lib/money';
import { categoryLabel } from '../lib/categories';
import { ProductImage } from './product-image';

/** Catalogue tile used on the homepage and the listing grid. */
export function ProductCard({
  product,
  headingLevel = 'h2',
  compact = false,
}: {
  product: ProductListItem;
  headingLevel?: 'h2' | 'h3';
  compact?: boolean;
}) {
  const t = useTranslations('products');
  const common = useTranslations('common');
  const tCategory = useTranslations('categories');
  const Heading = headingLevel;
  const from = lowestPrice(product.variants);
  const image = product.images?.[0];
  const category = categoryLabel(tCategory, product.category);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="border-cream-200 bg-cream-50 ease-soft hover:border-cream-300 group flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg"
    >
      <div className="relative">
        <ProductImage
          src={image?.url}
          alt={image?.altText || product.name}
          name={product.name}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="aspect-[5/4]"
          letterClassName={compact ? 'text-6xl' : 'text-[5.5rem]'}
        />
        <span className="bg-cream-50/90 text-clay-500 absolute left-3 top-3 max-w-[85%] truncate rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest">
          {category}
        </span>
      </div>

      <div className={`flex flex-1 flex-col gap-2 ${compact ? 'p-3 sm:p-4' : 'p-5'}`}>
        <Heading
          className={`text-forest-700 group-hover:text-brand-700 break-words font-serif transition-colors ${compact ? 'text-lg' : 'text-2xl'}`}
        >
          {product.name}
        </Heading>
        {!compact && (
          <p className="text-forest-500 line-clamp-2 text-sm leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="text-forest-500 text-xs">
          {t('by', { seller: product.seller.businessName })}
        </p>
        <div className="border-cream-200 mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="flex flex-col">
            <span className="text-forest-500 text-[0.65rem] font-medium uppercase tracking-widest">
              {t('fromPrice')}
            </span>
            <span className={`text-forest-700 font-bold ${compact ? 'text-base' : 'text-lg'}`}>
              {from ? common('price', { amount: from }) : '—'}
            </span>
          </span>
          <span className="text-brand-700 ease-soft inline-flex items-center gap-1 text-sm font-semibold transition-all duration-200 group-hover:gap-2">
            {t('view')}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
