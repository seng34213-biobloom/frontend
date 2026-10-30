import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ProductListItem } from '../lib/types';
import { lowestPrice } from '../lib/money';
import { categoryLabel } from '../lib/categories';
import { CardBuyBar } from './card-buy-bar';
import { ProductImage } from './product-image';

/** Catalogue tile used on the homepage and the listing grid. */
export function ProductCard({
  product,
  headingLevel = 'h2',
}: {
  product: ProductListItem;
  headingLevel?: 'h2' | 'h3';
}) {
  const t = useTranslations('products');
  const common = useTranslations('common');
  const tCategory = useTranslations('categories');
  const Heading = headingLevel;
  const from = lowestPrice(product.variants);
  const image = product.images?.[0];
  const href = `/products/${product.slug}`;
  const price = from ? common('price', { amount: from }) : '—';

  return (
    <article className="group relative flex h-full flex-col">
      {/* The title below is the keyboard and screen-reader link to the product. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block border-b border-black">
        <ProductImage
          src={image?.url}
          alt=""
          name={product.name}
          category={product.category}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="aspect-[10/13]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-7">
        <Heading className="break-words font-serif text-base">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </Heading>
        <p className="text-sm">
          {categoryLabel(tCategory, product.category)} ·{' '}
          {t('by', { seller: product.seller.businessName })}
        </p>
        <p className="mt-auto font-medium">
          {product.variants.length > 1 && from ? `${t('fromPrice')} ${price}` : price}
        </p>
      </div>

      <CardBuyBar
        price={price}
        href={href}
        variantId={product.variants.length === 1 ? product.variants[0].id : null}
      />
    </article>
  );
}
