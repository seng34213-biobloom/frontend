'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Spinner } from '@biobloom/ui';
import { ButtonLink } from '../../components/button-link';
import { InlineAlert } from '../../components/inline-alert';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import { addDays, formatOrderNumber } from '../../lib/format';
import type { OrderDetail } from '../../lib/types';
import { useRequireAuth } from '../../lib/use-require-auth';

const POLL_MS = 2000;
const POLL_LIMIT = 15;
/** SDS §6.3 confirmation: estimated delivery window after payment. */
const DELIVERY_DAYS = { from: 2, to: 4 };

/**
 * Return page after the hosted checkout. The gateway's signed webhook (not
 * the browser) marks the order paid, so this page polls the order briefly.
 */
function Complete() {
  const t = useTranslations('confirmation');
  const params = useSearchParams();
  const { ready } = useRequireAuth();
  const orderId = params.get('orderId') ?? '';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !orderId) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const o = await api<OrderDetail>('GET', `/api/orders/${orderId}`);
        setOrder(o);
        if (o.status === 'PENDING_PAYMENT' && ++tries < POLL_LIMIT)
          timer = setTimeout(() => void tick(), POLL_MS);
      } catch (e) {
        setError((e as Error).message);
      }
    };
    void tick();
    return () => clearTimeout(timer);
  }, [ready, orderId]);

  if (error) return <InlineAlert>{error}</InlineAlert>;
  if (!order) return <Spinner label={t('loading')} />;

  const paid = !['PENDING_PAYMENT', 'CANCELLED'].includes(order.status);
  return (
    <div className="contents" aria-live="polite">
      {paid ? (
        <>
          <PageHeader
            eyebrow={t('eyebrow')}
            title={t('thanks')}
            lead={t('paidLead', { number: formatOrderNumber(order.orderNumber) })}
          />
          <p>
            {t('estimate', {
              from: addDays(order.placedAt, DELIVERY_DAYS.from).toLocaleDateString(),
              to: addDays(order.placedAt, DELIVERY_DAYS.to).toLocaleDateString(),
            })}
          </p>
        </>
      ) : order.status === 'CANCELLED' ? (
        <PageHeader eyebrow={t('eyebrow')} title={t('failedTitle')} lead={t('failedLead')} />
      ) : (
        <PageHeader eyebrow={t('eyebrow')} title={t('pendingTitle')} lead={t('pendingLead')} />
      )}
      <dl className="grid max-w-lg grid-cols-2 gap-2 border border-black p-7">
        <dt>{t('orderNumber')}</dt>
        <dd className="text-right font-semibold">{formatOrderNumber(order.orderNumber)}</dd>
        <dt>{t('status')}</dt>
        <dd className="text-right">{t(`statuses.${order.status}`)}</dd>
        <dt>{t('total')}</dt>
        <dd className="text-right font-semibold">LKR {order.totalAmount}</dd>
      </dl>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/account/orders/${order.id}`}>{t('viewOrder')}</ButtonLink>
        <Link href="/products" className="self-center underline">
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <div className="page-stack">
      <Suspense fallback={null}>
        <Complete />
      </Suspense>
    </div>
  );
}
