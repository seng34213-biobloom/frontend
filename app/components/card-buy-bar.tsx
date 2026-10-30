'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCart } from '../lib/cart-context';
import { InlineAlert } from './inline-alert';

const barClass =
  'caps flex w-full items-center justify-around gap-3 bg-black px-3 py-4 text-sm font-light text-white transition-opacity duration-100 ease-soft hover:bg-bark [@media(hover:hover)]:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100';

/**
 * Black bar along the foot of a product tile, shown on hover and focus where
 * the device can hover and always on touch screens. Single-size products go
 * straight to the cart; anything else opens the product to choose a size.
 */
export function CardBuyBar({
  price,
  href,
  variantId,
}: {
  price: string;
  href: string;
  variantId: string | null;
}) {
  const t = useTranslations('products');
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!variantId) {
    return (
      <Link href={href} className={barClass}>
        <span>{price}</span>
        <span>{t('chooseSize')}</span>
      </Link>
    );
  }

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await addItem({ productVariantId: variantId as string, quantity: 1 }, href);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <button type="button" disabled={busy} onClick={() => void add()} className={barClass}>
        <span>{price}</span>
        <span>{busy ? t('adding') : t('addToCart')}</span>
      </button>
    </>
  );
}
