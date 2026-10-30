'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { TextAreaField, TextField } from '../../../components/form-field';
import { InlineAlert } from '../../../components/inline-alert';
import { PageHeader } from '../../../components/page-header';
import { api } from '../../../lib/api';
import { formatOrderNumber } from '../../../lib/format';
import type { OrderDetail } from '../../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../../lib/use-require-auth';

const STEPS = ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED'] as const;

/** Order tracking (SDS §6.7, DDP-#32): progress, items, fees, delivery, cancel unpaid, request a refund. */
export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await api<OrderDetail>('GET', `/api/orders/${id}`));
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }, [id, onAuthError]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  async function cancel() {
    setBusy(true);
    try {
      setOrder(await api<OrderDetail>('POST', `/api/orders/${id}/cancel`));
      setCancelOpen(false);
      setNotice(t('cancelled'));
    } catch (e) {
      setError((e as Error).message);
      setCancelOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function requestRefund(e: FormEvent) {
    e.preventDefault();
    setRefundError(null);
    if (refundReason.trim().length < 5) {
      setRefundError(t('refundReasonRule'));
      return;
    }
    setBusy(true);
    try {
      await api('POST', `/api/orders/${id}/refund-requests`, {
        reason: refundReason.trim(),
        ...(refundAmount ? { amount: Number(refundAmount) } : {}),
      });
      setNotice(t('refundRequested'));
      setRefundReason('');
      setRefundAmount('');
      await load();
    } catch (err) {
      setRefundError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="page-stack">
        <InlineAlert>{error}</InlineAlert>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="page-stack">
        <Spinner label={t('loading')} />
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const openRefund = order.refundRequests?.some(
    (r) => r.status === 'REQUESTED' || r.status === 'APPROVED',
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('eyebrow')}
        title={formatOrderNumber(order.orderNumber)}
        lead={t('placedOn', { date: new Date(order.placedAt).toLocaleString() })}
      />
      {notice ? (
        <div aria-live="polite">
          <InlineAlert tone="success">{notice}</InlineAlert>
        </div>
      ) : null}

      {stepIndex >= 0 ? (
        <ol className="grid grid-cols-5 gap-2" aria-label={t('progressLabel')}>
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={i === stepIndex ? 'step' : undefined}
              className="text-center text-xs"
            >
              <span
                className={`mx-auto mb-1 block h-2 rounded-full ${i <= stepIndex ? 'bg-black' : 'bg-cream-200'}`}
                aria-hidden="true"
              />
              <span className={i === stepIndex ? 'font-semibold' : ''}>{t(`statuses.${s}`)}</span>
              {i <= stepIndex ? <span className="sr-only"> ({t('done')})</span> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="bg-sun border border-black p-4">
          {t(`statuses.${order.status}`)}
          {order.cancellationReason ? ` — ${order.cancellationReason}` : ''}
        </p>
      )}

      <section aria-labelledby="items-h">
        <h2 id="items-h" className="font-serif text-xl">
          {t('itemsHeading')}
        </h2>
        <ul className="mt-3 divide-y divide-black border border-black">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 p-4 text-sm">
              <span>
                {it.quantity} × {it.productName} — {it.variantName} ({it.size})
                {it.bundleName ? (
                  <span className="text-forest-500 block text-xs">
                    {t('inBundle', { name: it.bundleName })}
                  </span>
                ) : null}
              </span>
              <span>LKR {it.lineTotal}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 grid max-w-xs grid-cols-2 gap-1 text-sm">
          <dt>{t('subtotal')}</dt>
          <dd className="text-right">LKR {order.subtotal}</dd>
          {Number(order.discountAmount) > 0 ? (
            <>
              <dt>{t('discount')}</dt>
              <dd className="text-right">− LKR {order.discountAmount}</dd>
            </>
          ) : null}
          <dt>{t('shipping')}</dt>
          <dd className="text-right">LKR {order.shippingFee}</dd>
          <dt className="font-semibold">{t('total')}</dt>
          <dd className="text-right font-semibold">LKR {order.totalAmount}</dd>
        </dl>
      </section>

      <section aria-labelledby="delivery-h" className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 id="delivery-h" className="font-serif text-xl">
            {t('deliveryHeading')}
          </h2>
          {order.delivery ? (
            <p className="text-sm">
              {t(`delivery.${order.delivery.status}`)}
              {order.delivery.riderName
                ? ` · ${t('rider', { name: order.delivery.riderName })}`
                : ''}
            </p>
          ) : (
            <p className="text-sm">
              {order.shippedAt
                ? t('shippedOn', { date: new Date(order.shippedAt).toLocaleDateString() })
                : t('notShipped')}
            </p>
          )}
          {order.deliveredAt ? (
            <p className="text-sm">
              {t('deliveredOn', { date: new Date(order.deliveredAt).toLocaleDateString() })}
            </p>
          ) : null}
        </div>
        {order.shippingAddress ? (
          <address className="text-sm not-italic">
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.line2 ? (
              <>
                {order.shippingAddress.line2}
                <br />
              </>
            ) : null}
            {order.shippingAddress.city}, {order.shippingAddress.district}{' '}
            {order.shippingAddress.postalCode}
          </address>
        ) : null}
      </section>

      {order.status === 'PENDING_PAYMENT' ? (
        <Button variant="secondary" onClick={() => setCancelOpen(true)}>
          {t('cancelOrder')}
        </Button>
      ) : null}

      {order.refundRequests && order.refundRequests.length > 0 ? (
        <section aria-labelledby="refunds-h">
          <h2 id="refunds-h" className="font-serif text-xl">
            {t('refundsHeading')}
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {order.refundRequests.map((r) => (
              <li key={r.id}>
                LKR {r.amount} · {t(`refundStatuses.${r.status}`)} · {r.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {order.status === 'DELIVERED' && !openRefund ? (
        <form onSubmit={requestRefund} className="space-y-3 border border-black p-7" noValidate>
          <h2 className="font-serif text-xl">{t('requestRefund')}</h2>
          <TextField
            label={t('refundAmount')}
            hint={t('refundAmountHint', { total: order.totalAmount })}
            inputMode="decimal"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <TextAreaField
            label={t('refundReason')}
            required
            value={refundReason}
            error={refundError ?? undefined}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {t('submitRefund')}
          </Button>
        </form>
      ) : null}

      <Link href="/account/orders" className="inline-block underline">
        {t('backToOrders')}
      </Link>

      <ConfirmDialog
        open={cancelOpen}
        title={t('cancelTitle')}
        description={t('cancelBody')}
        confirmLabel={t('cancelOrder')}
        cancelLabel={t('keepOrder')}
        busy={busy}
        onConfirm={() => void cancel()}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
