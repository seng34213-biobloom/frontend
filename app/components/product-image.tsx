'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ProductArt } from './product-art';

/**
 * Product photo on a white pack-shot tile, falling back to the illustrated
 * pack when the product has no image yet or the media host cannot serve it.
 * Images are loaded by the browser straight from the media origin
 * (`unoptimized`), because the Next.js server inside Docker cannot reach the
 * public MinIO URL.
 */
export function ProductImage({
  src,
  alt,
  name,
  category,
  sizes,
  priority = false,
  className = '',
}: {
  src?: string | null;
  alt: string;
  name: string;
  category?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`relative flex items-center justify-center overflow-hidden bg-white ${className}`}
      >
        <ProductArt name={name} category={category} className="h-[92%] w-full" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={() => setFailed(true)}
        className="object-contain"
      />
    </div>
  );
}
