'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ProductImage } from '../../components/product-image';
import type { ProductImage as ProductImageData } from '../../lib/types';

/**
 * Main product image with a thumbnail strip (SDS §6.2). Falls back to the
 * illustrated pack when the product has no photos yet.
 */
export function ProductGallery({
  name,
  category,
  images,
}: {
  name: string;
  category?: string;
  images: ProductImageData[];
}) {
  const t = useTranslations('pdp');
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="lg:sticky lg:top-[5.5rem]">
      <ProductImage
        src={current?.url}
        alt={current?.altText || name}
        name={name}
        category={category}
        sizes="(min-width: 1024px) 34vw, 100vw"
        priority
        className="aspect-[10/12]"
      />
      {images.length > 1 && (
        <ul className="flex border-t border-black" aria-label={t('gallery')}>
          {images.map((img, i) => (
            <li key={img.id} className="min-w-0 flex-1 border-r border-black last:border-r-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={t('showImage', { n: i + 1, total: images.length })}
                className={`block w-full ${i === active ? 'outline outline-2 -outline-offset-2 outline-black' : ''}`}
              >
                <ProductImage
                  src={img.url}
                  alt=""
                  name={name}
                  category={category}
                  sizes="160px"
                  className="aspect-square"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
