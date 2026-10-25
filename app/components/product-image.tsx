'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * Product photo with the artisan-label panel as a fallback when the product
 * has no image yet or the media host cannot serve it. Images are loaded by
 * the browser straight from the media origin (`unoptimized`), because the
 * Next.js server inside Docker cannot reach the public MinIO URL.
 */
export function ProductImage({
  src,
  alt,
  name,
  sizes,
  priority = false,
  className = '',
  letterClassName = 'text-[5.5rem]',
}: {
  src?: string | null;
  alt: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  letterClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`label-panel relative flex items-center justify-center overflow-hidden ${className}`}
      >
        <span
          aria-hidden="true"
          className={`tracking-tightest text-forest-700/15 font-serif leading-none ${letterClassName}`}
        >
          {name.trim().charAt(0)}
        </span>
      </div>
    );
  }
  return (
    <div className={`bg-cream-100 relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}
