'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@biobloom/ui';
import { InlineAlert } from '../../components/inline-alert';
import { StockIndicator } from '../../components/stock-indicator';
import { api, isApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
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

  async function addToCart() {
    if (!user) {
      router.push(loginHref(here));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await api('POST', '/api/cart/items', { productVariantId: variant.id, quantity });
      setMessage({
        tone: 'success',
        text: t('addedToCart', { name: `${productName} ${variant.size}` }),
      });
    } catch (e) {
      if (isApiError(e, 401)) router.push(loginHref(here));
      else setMessage({ tone: 'error', text: (e as Error).message });
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
    <section
      className="border-cream-200 space-y-6 rounded-3xl border bg-white p-6 shadow-sm"
      aria-labelledby="buy-h"
    >
      <h2 id="buy-h" className="sr-only">
        {t('buyHeading')}
      </h2>
      <fieldset>
        <legend className="text-forest-500 text-xs font-medium uppercase tracking-widest">
          {t('pickSize')}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
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
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                v.id === variant.id
                  ? 'border-forest-700 bg-forest-700 text-cream-50'
                  : 'border-forest-300 text-forest-700 bg-white'
              }`}
            >
              {v.size}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-forest-800 text-3xl font-semibold">
          {subscribe ? (
            <>
              <span className="text-forest-500 mr-2 text-lg line-through">
                LKR {fromCents(unitCents)}
              </span>
              LKR {fromCents(subscribeUnitCents)}
            </>
          ) : (
            <>LKR {fromCents(unitCents)}</>
          )}
        </p>
        <p className="text-forest-600 text-sm">
          {variant.name} · {t('sku', { sku: variant.sku, weight: variant.unitWeightG })}
        </p>
      </div>

      <StockIndicator stock={stock} id="variant-stock" />
      {earliestExpiryByVariant[variant.id] ? (
        <p className="text-forest-500 text-xs">
          {t('fifoHint', {
            date: new Date(earliestExpiryByVariant[variant.id] as string).toLocaleDateString(),
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-forest-500 flex flex-col gap-1 text-xs font-medium uppercase tracking-widest">
          {t('quantity')}
          <input
            type="number"
            min={1}
            max={Math.max(1, Math.min(99, stock))}
            value={quantity}
            disabled={soldOut}
            aria-describedby="variant-stock"
            onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="border-forest-300 text-forest-700 w-24 rounded-lg border px-3 py-2 text-base"
          />
        </label>
        <p className="text-sm">
          {t('subtotal')}: <strong>LKR {fromCents(lineCents)}</strong>
        </p>
      </div>

      <div className="border-brand-200 bg-brand-50 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <input
            id="sns-toggle"
            type="checkbox"
            className="mt-1"
            checked={subscribe}
            onChange={(e) => setSubscribe(e.target.checked)}
            aria-describedby="sns-desc"
          />
          <div>
            <label htmlFor="sns-toggle" className="font-semibold">
              {t('subscribeAndSave')}
            </label>
            <p id="sns-desc" className="text-forest-600 text-sm">
              {t('subscribeDescription')}
            </p>
          </div>
        </div>
        {subscribe ? (
          <label className="text-forest-500 mt-3 flex flex-col gap-1 text-xs font-medium uppercase tracking-widest">
            {t('frequencyEvery')}
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="border-forest-300 text-forest-700 w-56 rounded-lg border bg-white px-3 py-2 text-base normal-case tracking-normal"
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

      <div className="flex flex-wrap gap-3">
        {subscribe ? (
          <Button onClick={startSubscription} disabled={soldOut}>
            {t('startSubscription')}
          </Button>
        ) : (
          <Button onClick={() => void addToCart()} disabled={soldOut || busy}>
            {busy ? t('adding') : t('addToCart')}
          </Button>
        )}
      </div>
    </section>
  );
}
