'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Spinner } from '@biobloom/ui';
import { ButtonLink } from '../../components/button-link';
import { InlineAlert } from '../../components/inline-alert';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import { formatOrderNumber } from '../../lib/format';
import type { OrderSummary } from '../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../lib/use-require-auth';

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
    <div className="page-stack">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {!orders && !error ? <Spinner label={t('loading')} /> : null}
      {orders && orders.length === 0 ? (
        <div className="border border-black p-8 text-center">
          <p>{t('empty')}</p>
          <ButtonLink href="/products" className="mt-4">
            {t('browse')}
          </ButtonLink>
        </div>
      ) : null}
      {orders && orders.length > 0 ? (
        <ul className="divide-y divide-black border border-black">
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
              <span className="caps border border-black px-2 py-0.5 text-sm font-medium">
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
