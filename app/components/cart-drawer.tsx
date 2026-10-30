'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Modal } from '@biobloom/ui';
import { api } from '../lib/api';
import { useCart } from '../lib/cart-context';
import type { CartLine, CartView } from '../lib/types';
import { buttonClass } from './button-styles';
import { CartLineRow } from './cart-line';
import { CloseIcon } from './icons';

/**
 * Slide-over cart. Built on the shared Modal so focus is trapped and returned
 * and Escape closes it. Quantity changes go to the API, which is the source of
 * truth for live stock; a rejected change is shown on its line.
 */
export function CartDrawer() {
  const t = useTranslations('cart');
  const { cart, drawerOpen, closeDrawer, setCart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function update(line: CartLine, quantity: number) {
    setBusyId(line.id);
    setErrors((prev) => ({ ...prev, [line.id]: '' }));
    try {
      setCart(
        quantity <= 0
          ? await api<CartView>('DELETE', `/api/cart/items/${line.id}`)
          : await api<CartView>('PATCH', `/api/cart/items/${line.id}`, { quantity }),
      );
    } catch (e) {
      setErrors((prev) => ({ ...prev, [line.id]: (e as Error).message }));
    } finally {
      setBusyId(null);
    }
  }

  const empty = !cart || cart.items.length === 0;

  return (
    <Modal open={drawerOpen} onClose={closeDrawer} title={t('drawerTitle')} placement="side" bare>
      <div className="flex items-center justify-between border-b border-black px-5 py-4">
        <p aria-hidden="true" className="text-xl">
          {t('drawerTitle')}
        </p>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label={t('closeDrawer')}
          className="hover:text-brand-400 p-1"
        >
          <CloseIcon />
        </button>
      </div>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 py-24 text-center">
          <p className="text-xl font-semibold">{t('empty')}</p>
          <Link
            href="/products"
            onClick={closeDrawer}
            className="caps font-semibold hover:underline"
          >
            {t('continueShopping')}
          </Link>
        </div>
      ) : (
        <>
          <p className="border-b border-black px-5 py-3 text-center font-medium">
            {t('weightSoFar', { grams: cart.totalWeightG })}
          </p>
          <ul>
            {cart.items.map((line) => (
              <CartLineRow
                key={line.id}
                line={line}
                busy={busyId === line.id}
                error={errors[line.id]}
                onChange={(q) => void update(line, q)}
              />
            ))}
          </ul>
          <dl className="flex items-center justify-between border-b border-black p-3 font-medium">
            <dt>{t('subtotal')}:</dt>
            <dd>LKR {cart.subtotal}</dd>
          </dl>
          <div className="p-2">
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className={buttonClass('primary', 'w-full')}
            >
              {t('checkOut')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="caps flex flex-wrap items-center justify-between gap-3 border-b border-black px-7 py-5 font-semibold">
            <Link href="/cart" onClick={closeDrawer} className="hover:underline">
              {t('viewCart')}
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="caps font-semibold hover:underline"
            >
              {t('continueShopping')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
