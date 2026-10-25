'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ProductImage } from '../../../components/product-image';
import type { ProductImage as ProductImageData } from '../../../lib/types';

/**
 * Main product image with a thumbnail strip (SDS §6.2). Falls back to the
 * artisan-label panel when the product has no photos yet.
 */
export function ProductGallery({ name, images }: { name: string; images: ProductImageData[] }) {
  const t = useTranslations('pdp');
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
      <ProductImage
        src={current?.url}
        alt={current?.altText || name}
        name={name}
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className="border-cream-200 aspect-square rounded-3xl border shadow-md"
        letterClassName="text-[8rem]"
      />
      {images.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label={t('gallery')}>
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={t('showImage', { n: i + 1, total: images.length })}
                className={`block h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                  i === active ? 'border-brand-600' : 'border-cream-200 hover:border-brand-300'
                }`}
              >
                <ProductImage
                  src={img.url}
                  alt=""
                  name={name}
                  sizes="64px"
                  className="h-full w-full"
                  letterClassName="text-2xl"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
