'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Spinner } from '@biobloom/ui';
import { ButtonLink } from '../../../components/button-link';
import { InlineAlert } from '../../../components/inline-alert';
import { PageHeader } from '../../../components/page-header';
import { api } from '../../../lib/api';
import { formatOrderNumber } from '../../../lib/format';
import type { OrderSummary } from '../../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../../lib/use-require-auth';

/** Order history (SDS §6.7, DDP-#32). */
export default function OrdersPage() {
  const t = useTranslations('orders');
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api<OrderSummary[]>('GET', '/api/orders').then(setOrders, (e) => {
      if (!onAuthError(e)) setError((e as Error).message);
    });
  }, [ready, onAuthError]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {!orders && !error ? <Spinner label={t('loading')} /> : null}
      {orders && orders.length === 0 ? (
        <div className="border-cream-200 mt-6 rounded-3xl border bg-white p-8 text-center">
          <p>{t('empty')}</p>
          <ButtonLink href="/products" className="mt-4">
            {t('browse')}
          </ButtonLink>
        </div>
      ) : null}
      {orders && orders.length > 0 ? (
        <ul className="divide-cream-200 border-cream-200 mt-6 divide-y rounded-3xl border bg-white">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="text-forest-800 font-semibold underline"
                >
                  {formatOrderNumber(o.orderNumber)}
                </Link>
                <p className="text-forest-600 text-sm">
                  {new Date(o.placedAt).toLocaleDateString()} · {t('items', { count: o.itemCount })}
                </p>
              </div>
              <span className="bg-cream-100 rounded-full px-3 py-1 text-sm font-medium">
                {t(`statuses.${o.status}`)}
              </span>
              <span className="font-semibold">LKR {o.totalAmount}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
