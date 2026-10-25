'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { InlineAlert } from '../../components/inline-alert';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import { formatOrderNumber } from '../../lib/format';
import type { OrderDetail } from '../../lib/types';
import { useRequireAuth } from '../../lib/use-require-auth';

/**
 * Stand-in for the gateway's hosted payment page when the API runs with
 * PAYMENTS_MODE=mock (local preview, ADR-012). The choice goes through the
 * same code path as a verified gateway webhook.
 */
function MockPayment() {
  const t = useTranslations('mockPay');
  const params = useSearchParams();
  const router = useRouter();
  const { ready } = useRequireAuth();
  const paymentId = params.get('paymentId') ?? '';
  const orderId = params.get('orderId') ?? '';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !orderId) return;
    api<OrderDetail>('GET', `/api/orders/${orderId}`).then(setOrder, (e: Error) =>
      setError(e.message),
    );
  }, [ready, orderId]);

  async function pay(outcome: 'success' | 'failure') {
    setBusy(true);
    setError(null);
    try {
      await api('POST', `/api/payments/${paymentId}/simulate`, { outcome });
      router.replace(`/checkout/complete?orderId=${orderId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} lead={t('lead')} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {!order && !error ? <Spinner label={t('loading')} /> : null}
      {order ? (
        <div className="border-cream-200 mt-6 space-y-4 rounded-3xl border bg-white p-6">
          <p>{t('order', { number: formatOrderNumber(order.orderNumber) })}</p>
          <p className="text-3xl font-semibold">LKR {order.totalAmount}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || order.status !== 'PENDING_PAYMENT'}
              onClick={() => void pay('success')}
            >
              {t('pay')}
            </Button>
            <Button
              variant="ghost"
              disabled={busy || order.status !== 'PENDING_PAYMENT'}
              onClick={() => void pay('failure')}
            >
              {t('fail')}
            </Button>
          </div>
          {order.status !== 'PENDING_PAYMENT' ? (
            <p className="text-sm">{t('alreadyHandled')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={null}>
      <MockPayment />
    </Suspense>
  );
}
