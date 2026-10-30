'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { buttonClass } from '../../components/button-styles';
import { MinusIcon, PlusIcon } from '../../components/icons';
import { InlineAlert } from '../../components/inline-alert';
import { StockIndicator } from '../../components/stock-indicator';
import { useAuth } from '../../lib/auth-context';
import { useCart } from '../../lib/cart-context';
import { discountCents, fromCents, toCents } from '../../lib/money';
import { loginHref } from '../../lib/navigation';
import type { ProductVariant } from '../../lib/types';

/** SDS §6.4 — Subscribe & Save locks a 10% discount at sign-up; the API stores and returns the rate. */
export const SUBSCRIBE_DISCOUNT_RATE = '0.10';
const FREQUENCIES = [14, 30, 60] as const;

interface Props {
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  stockByVariant: Record<string, number>;
  earliestExpiryByVariant: Record<string, string | null>;
}

/**
 * Variant selector, live stock indicator (announced through an aria-live
 * region when the variant changes, WCAG 4.1.3), Add to Cart and the
 * Subscribe & Save toggle (SDS §6.2). Purchase buttons are disabled at zero
 * stock; anonymous visitors are sent to sign in and brought back.
 */
export function VariantPanel({
  productSlug,
  productName,
  variants,
  stockByVariant,
  earliestExpiryByVariant,
}: Props) {
  const t = useTranslations('pdp');
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const firstInStock = variants.find((v) => (stockByVariant[v.id] ?? 0) > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [subscribe, setSubscribe] = useState(false);
  const [frequency, setFrequency] = useState<number>(30);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const variant = useMemo(
    () => variants.find((v) => v.id === variantId) ?? variants[0],
    [variants, variantId],
  );
  if (!variant) return <p>{t('noVariants')}</p>;
  const stock = stockByVariant[variant.id] ?? 0;
  const soldOut = stock <= 0;
  const unitCents = toCents(variant.price);
  const subscribeUnitCents = unitCents - discountCents(unitCents, SUBSCRIBE_DISCOUNT_RATE);
  const lineCents = (subscribe ? subscribeUnitCents : unitCents) * quantity;
  const here = `/products/${productSlug}`;

  const maxQuantity = Math.max(1, Math.min(99, stock));

  async function addToCart() {
    setBusy(true);
    setMessage(null);
    try {
      const added = await addItem({ productVariantId: variant.id, quantity }, here);
      if (added) {
        setMessage({
          tone: 'success',
          text: t('addedToCart', { name: `${productName} ${variant.size}` }),
        });
      }
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function startSubscription() {
    const target = `/checkout?subscribe=1&variantId=${variant.id}&quantity=${quantity}&frequency=${frequency}&name=${encodeURIComponent(
      `${productName} — ${variant.name} (${variant.size})`,
    )}&price=${variant.price}`;
    router.push(user ? target : loginHref(target));
  }

  return (
    <section className="space-y-5 px-7 pb-7" aria-labelledby="buy-h">
      <h2 id="buy-h" className="sr-only">
        {t('buyHeading')}
      </h2>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-lg">
          {subscribe ? (
            <>
              <span className="mr-2 line-through">LKR {fromCents(unitCents)}</span>
              LKR {fromCents(subscribeUnitCents)}
            </>
          ) : (
            <>LKR {fromCents(unitCents)}</>
          )}
        </p>
        <p className="text-sm">
          {variant.name} ·{' '}
          {t('sku', {
            sku: variant.sku,
            weight: variant.unitWeightGrams ?? variant.unitWeightG ?? 0,
          })}
        </p>
      </div>

      <StockIndicator stock={stock} id="variant-stock" />
      {earliestExpiryByVariant[variant.id] ? (
        <p className="text-sm">
          {t('fifoHint', {
            date: new Date(earliestExpiryByVariant[variant.id] as string).toLocaleDateString(),
          })}
        </p>
      ) : null}

      <div>
        <label htmlFor="variant-quantity" className="mb-1 block font-medium">
          {t('quantity')}
        </label>
        <div className="grid grid-cols-3 divide-x divide-black border border-black">
          <button
            type="button"
            disabled={soldOut || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label={t('decreaseQuantity')}
            className="hover:bg-sun flex items-center justify-center py-4 disabled:opacity-40"
          >
            <MinusIcon />
          </button>
          <input
            id="variant-quantity"
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            disabled={soldOut}
            aria-describedby="variant-stock"
            onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="no-spin min-w-0 bg-transparent py-4 text-center"
          />
          <button
            type="button"
            disabled={soldOut || quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            aria-label={t('increaseQuantity')}
            className="hover:bg-sun flex items-center justify-center py-4 disabled:opacity-40"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 font-medium">{t('pickSize')}</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === variant.id}
              onClick={() => {
                setVariantId(v.id);
                setQuantity(1);
                setMessage(null);
              }}
              className={`flex flex-col items-center gap-1 border px-3 py-5 text-center ${
                v.id === variant.id
                  ? 'border-black outline outline-2 -outline-offset-2 outline-black'
                  : 'hover:bg-sun border-black'
              }`}
            >
              <span className="caps text-sm font-medium">{v.size}</span>
              <span>LKR {fromCents(toCents(v.price))}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="border border-black p-5">
        <div className="flex items-start gap-3">
          <input
            id="sns-toggle"
            type="checkbox"
            className="mt-1.5 h-4 w-4 accent-black"
            checked={subscribe}
            onChange={(e) => setSubscribe(e.target.checked)}
            aria-describedby="sns-desc"
          />
          <div>
            <label htmlFor="sns-toggle" className="font-semibold">
              {t('subscribeAndSave')}
            </label>
            <p id="sns-desc" className="text-sm">
              {t('subscribeDescription')}
            </p>
          </div>
        </div>
        {subscribe ? (
          <label className="mt-3 flex flex-col gap-1 font-medium">
            {t('frequencyEvery')}
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full max-w-xs border border-black bg-white px-4 py-3 font-normal"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {t('frequencyDays', { days: f })}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {message ? (
        <div aria-live="polite">
          <InlineAlert tone={message.tone}>{message.text}</InlineAlert>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10">
        {subscribe ? (
          <button
            type="button"
            onClick={startSubscription}
            disabled={soldOut}
            className={buttonClass('primary', 'w-full')}
          >
            {t('startSubscription')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void addToCart()}
            disabled={soldOut || busy}
            className={buttonClass('primary', 'w-full')}
          >
            {busy ? t('adding') : `LKR ${fromCents(lineCents)} — ${t('addToCart')}`}
          </button>
        )}
      </div>
    </section>
  );
}
