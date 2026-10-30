'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@biobloom/ui';
import { ButtonLink } from '../components/button-link';
import { CartLineRow } from '../components/cart-line';
import { InlineAlert } from '../components/inline-alert';
import { PageHeader } from '../components/page-header';
import { api } from '../lib/api';
import { useCart } from '../lib/cart-context';
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
  const { setCart: shareCart } = useCart();
  const [cart, setCartState] = useState<CartView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  // Keeps the header count in step with this page's own copy of the cart.
  const setCart = useCallback(
    (next: CartView) => {
      setCartState(next);
      shareCart(next);
    },
    [shareCart],
  );

  const load = useCallback(async () => {
    try {
      setCart(await api<CartView>('GET', '/api/cart'));
      setError(null);
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }, [onAuthError, setCart]);

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
      <div className="px-7 py-32 text-center">
        <Spinner label={t('loading')} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={t('stepIndicator')} title={t('heading')} />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {cart && cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-7 py-40 text-center">
          <p className="text-xl font-semibold">{t('empty')}</p>
          <Link href="/products" className="caps font-semibold hover:underline">
            {t('continueShopping')}
          </Link>
        </div>
      ) : null}
      {cart && cart.items.length > 0 ? (
        <div className="grid lg:grid-cols-[2fr_1fr]">
          <ul className="border-black lg:border-r">
            {cart.items.map((line) => (
              <CartLineRow
                key={line.id}
                line={line}
                busy={busyId === line.id}
                error={lineErrors[line.id]}
                onChange={(q) => void update(line, q)}
              />
            ))}
          </ul>
          <div className="band lg:border-b-0">
            <dl className="grid grid-cols-2 gap-2 p-7">
              <dt>{t('items')}</dt>
              <dd className="text-right">{cart.itemCount}</dd>
              <dt>{t('totalWeight')}</dt>
              <dd className="text-right">{cart.totalWeightG} g</dd>
              <dt className="font-semibold">{t('subtotal')}</dt>
              <dd className="text-right font-semibold">LKR {cart.subtotal}</dd>
            </dl>
            <p className="px-7 pb-5 text-sm">{t('shippingNote')}</p>
            <div className="p-2">
              <ButtonLink href="/checkout" className="w-full">
                {t('continueCheckout')}
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
