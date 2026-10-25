'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { ButtonLink } from '../components/button-link';
import { InlineAlert } from '../components/inline-alert';
import { PageHeader } from '../components/page-header';
import { api } from '../lib/api';
import type { CartLine, CartView } from '../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../lib/use-require-auth';

/**
 * Step 1 of 2 (SDS §6.3): review the cart. Quantity changes are checked
 * against live stock; a 409 is shown inline on the line and the quantity is
 * kept. The shipping fee is calculated from weight on the next step.
 */
export default function CartPage() {
  const t = useTranslations('cart');
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [cart, setCart] = useState<CartView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const load = useCallback(async () => {
    try {
      setCart(await api<CartView>('GET', '/api/cart'));
      setError(null);
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }, [onAuthError]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  async function update(line: CartLine, quantity: number) {
    setBusyId(line.id);
    setLineErrors((prev) => ({ ...prev, [line.id]: '' }));
    try {
      const next =
        quantity <= 0
          ? await api<CartView>('DELETE', `/api/cart/items/${line.id}`)
          : await api<CartView>('PATCH', `/api/cart/items/${line.id}`, { quantity });
      setCart(next);
      setAnnounce(quantity <= 0 ? t('removed') : t('updated'));
    } catch (e) {
      if (!onAuthError(e)) setLineErrors((prev) => ({ ...prev, [line.id]: (e as Error).message }));
    } finally {
      setBusyId(null);
    }
  }

  if (!ready || (!cart && !error)) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Spinner label={t('loading')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader eyebrow={t('stepIndicator')} title={t('heading')} />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {cart && cart.items.length === 0 ? (
        <div className="border-cream-200 mt-8 rounded-3xl border bg-white p-8 text-center">
          <p className="text-lg">{t('empty')}</p>
          <ButtonLink href="/products" className="mt-4">
            {t('browse')}
          </ButtonLink>
        </div>
      ) : null}
      {cart && cart.items.length > 0 ? (
        <>
          <ul className="divide-cream-200 border-cream-200 mt-6 divide-y rounded-3xl border bg-white">
            {cart.items.map((line) => {
              const name = line.variant
                ? `${line.variant.productName} — ${line.variant.name} (${line.variant.size})`
                : (line.bundle?.name ?? '');
              const href = line.variant
                ? `/products/${line.variant.productSlug}`
                : `/bundles/${line.bundle?.slug}`;
              const unit = line.variant?.price ?? line.bundle?.price ?? '0';
              const short = line.available < line.quantity;
              return (
                <li
                  key={line.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link href={href} className="text-forest-800 font-semibold hover:underline">
                      {name}
                    </Link>
                    <p className="text-forest-600 text-sm">{t('perUnit', { price: unit })}</p>
                    <p className="text-sm" aria-live="polite">
                      {short ? (
                        <span className="text-danger-700 font-medium">
                          {t('onlyNLeft', { count: line.available })}
                        </span>
                      ) : (
                        <span className="text-forest-600">{t('inStock')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-forest-500 text-xs font-medium uppercase tracking-widest">
                      {t('quantity')}
                      <input
                        type="number"
                        min={0}
                        max={99}
                        defaultValue={line.quantity}
                        key={`${line.id}-${line.quantity}`}
                        disabled={busyId === line.id}
                        aria-describedby={lineErrors[line.id] ? `err-${line.id}` : undefined}
                        aria-invalid={Boolean(lineErrors[line.id]) || undefined}
                        onBlur={(e) => {
                          const q = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                          if (q !== line.quantity) void update(line, q);
                        }}
                        className="border-forest-300 text-forest-700 ml-2 w-20 rounded-lg border px-2 py-1 text-base"
                      />
                    </label>
                    <span className="w-28 text-right font-semibold">LKR {line.lineSubtotal}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === line.id}
                      onClick={() => void update(line, 0)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                  {lineErrors[line.id] ? (
                    <p
                      id={`err-${line.id}`}
                      role="alert"
                      className="text-danger-700 text-sm font-medium sm:basis-full"
                    >
                      {lineErrors[line.id]}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <dl className="ml-auto mt-6 grid max-w-sm grid-cols-2 gap-2 text-sm">
            <dt>{t('items')}</dt>
            <dd className="text-right">{cart.itemCount}</dd>
            <dt>{t('totalWeight')}</dt>
            <dd className="text-right">{cart.totalWeightG} g</dd>
            <dt className="font-semibold">{t('subtotal')}</dt>
            <dd className="text-right font-semibold">LKR {cart.subtotal}</dd>
          </dl>
          <p className="text-forest-600 mt-2 text-right text-sm">{t('shippingNote')}</p>
          <div className="mt-6 flex justify-end">
            <ButtonLink href="/checkout">{t('continueCheckout')}</ButtonLink>
          </div>
        </>
      ) : null}
    </div>
  );
}
