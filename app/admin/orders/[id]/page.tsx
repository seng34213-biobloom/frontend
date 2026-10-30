'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Alert,
  Button,
  ConfirmDialog,
  FormField,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Textarea,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../../components/admin/PageHeader';
import { StatusBadge } from '../../../components/admin/StatusBadge';
import { adminApi, errorMessage } from '../../../lib/admin/api';
import { useAuth } from '../../../lib/admin/auth-context';
import { fmtDateTime, fmtMoney, fmtOrderNumber } from '../../../lib/admin/format';
import { useResource } from '../../../lib/admin/use-resource';

interface OrderDetail {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  subtotal: string;
  discountAmount: string;
  promoCode: string | null;
  shippingFee: string;
  totalAmount: string;
  totalWeightG: number;
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  customer: { name: string; email: string; phone: string | null };
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    district: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    productName: string | null;
    variantName: string | null;
    size: string | null;
    sku: string | null;
    bundleName: string | null;
    batchId: string | null;
    quantity: number;
    unitPriceSnapshot: string;
    lineTotal: string;
  }>;
  payments: Array<{
    id: string;
    gateway: string;
    status: string;
    amount: string;
    refundedAmount: string;
  }>;
  refundRequests: Array<{
    id: string;
    amount: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  delivery: {
    status: string;
    riderName: string;
    attempts: number;
    failureReason: string | null;
    assignedAt: string;
    deliveredAt: string | null;
  } | null;
}

const CANCELLABLE = ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const order = useResource(() => adminApi<OrderDetail>('GET', `/api/admin/orders/${id}`), [id]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', `/api/admin/orders/${id}/cancel`, { reason });
      setCancelOpen(false);
      setNotice('Order cancelled. Any captured payment was refunded and stock returned.');
      await order.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (order.error) return <Alert tone="error">{order.error}</Alert>;
  if (!order.data) return <Spinner label="Loading order" />;
  const o = order.data;
  const canCancel = user?.role === 'ADMIN' && CANCELLABLE.includes(o.status);

  return (
    <>
      <PageHeader
        eyebrow="Order"
        title={fmtOrderNumber(o.orderNumber, o.id)}
        description={`Placed ${fmtDateTime(o.placedAt)} by ${o.customer.name} (${o.customer.email})`}
        actions={
          canCancel ? (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          ) : null
        }
      />
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <section className="space-y-2 border border-black p-4" aria-labelledby="status-h">
          <h2 id="status-h" className="font-semibold">
            Status
          </h2>
          <p>
            Order <StatusBadge status={o.status} /> · Payment{' '}
            <StatusBadge status={o.paymentStatus} />
          </p>
          {o.cancellationReason ? <p className="text-sm">Reason: {o.cancellationReason}</p> : null}
          <dl className="text-sm">
            <dt className="inline font-medium">Shipped: </dt>
            <dd className="inline">{fmtDateTime(o.shippedAt)}</dd>
            <br />
            <dt className="inline font-medium">Delivered: </dt>
            <dd className="inline">{fmtDateTime(o.deliveredAt)}</dd>
          </dl>
        </section>
        <section className="space-y-1 border border-black p-4 text-sm" aria-labelledby="ship-h">
          <h2 id="ship-h" className="font-semibold">
            Ship to
          </h2>
          <p>{o.customer.name}</p>
          <p>{o.shippingAddress.line1}</p>
          {o.shippingAddress.line2 ? <p>{o.shippingAddress.line2}</p> : null}
          <p>
            {o.shippingAddress.city}, {o.shippingAddress.district} {o.shippingAddress.postalCode}
          </p>
          {o.customer.phone ? <p>{o.customer.phone}</p> : null}
        </section>
        <section className="space-y-1 border border-black p-4 text-sm" aria-labelledby="del-h">
          <h2 id="del-h" className="font-semibold">
            Delivery
          </h2>
          {o.delivery ? (
            <>
              <p>
                <StatusBadge status={o.delivery.status} /> with {o.delivery.riderName} (attempt{' '}
                {o.delivery.attempts})
              </p>
              {o.delivery.failureReason ? <p>Last failure: {o.delivery.failureReason}</p> : null}
              <p>Assigned {fmtDateTime(o.delivery.assignedAt)}</p>
            </>
          ) : (
            <p>
              Not assigned yet. Use the{' '}
              <Link href="/admin/fulfilment" className="underline">
                fulfilment queue
              </Link>
              .
            </p>
          )}
        </section>
      </div>

      <h2 className="mt-8 font-serif text-xl">Items</h2>
      <Table caption="Order items" captionHidden>
        <TableHead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Batch</Th>
            <Th align="right">Qty</Th>
            <Th align="right">Unit</Th>
            <Th align="right">Line total</Th>
          </tr>
        </TableHead>
        <TableBody>
          {o.items.map((it) => (
            <tr key={it.id}>
              <Td>
                {it.productName} {it.variantName ? `· ${it.variantName}` : ''}{' '}
                {it.size ? `(${it.size})` : ''}
                {it.bundleName ? (
                  <div className="text-forest-500 text-xs">Part of {it.bundleName}</div>
                ) : null}
              </Td>
              <Td>{it.sku ?? '—'}</Td>
              <Td className="font-mono text-xs">{it.batchId ? it.batchId.slice(0, 8) : '—'}</Td>
              <Td align="right">{it.quantity}</Td>
              <Td align="right">{fmtMoney(it.unitPriceSnapshot)}</Td>
              <Td align="right">{fmtMoney(it.lineTotal)}</Td>
            </tr>
          ))}
        </TableBody>
      </Table>
      <dl className="ml-auto mt-4 grid max-w-xs grid-cols-2 gap-1 text-sm">
        <dt>Subtotal</dt>
        <dd className="text-right">{fmtMoney(o.subtotal)}</dd>
        <dt>Discount{o.promoCode ? ` (${o.promoCode})` : ''}</dt>
        <dd className="text-right">−{fmtMoney(o.discountAmount)}</dd>
        <dt>Shipping ({o.totalWeightG} g)</dt>
        <dd className="text-right">{fmtMoney(o.shippingFee)}</dd>
        <dt className="font-semibold">Total</dt>
        <dd className="text-right font-semibold">{fmtMoney(o.totalAmount)}</dd>
      </dl>

      <h2 className="mt-8 font-serif text-xl">Payments</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {o.payments.length === 0 ? <li>No payments yet.</li> : null}
        {o.payments.map((p) => (
          <li key={p.id}>
            {p.gateway} · {fmtMoney(p.amount)} · <StatusBadge status={p.status} />
            {Number(p.refundedAmount) > 0 ? ` · refunded ${fmtMoney(p.refundedAmount)}` : ''}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-serif text-xl">Refund requests</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {o.refundRequests.length === 0 ? <li>None.</li> : null}
        {o.refundRequests.map((r) => (
          <li key={r.id}>
            {fmtMoney(r.amount)} · <StatusBadge status={r.status} /> · {r.reason}{' '}
            <Link href="/admin/refund-requests" className="underline">
              Review
            </Link>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={cancelOpen}
        title={`Cancel ${fmtOrderNumber(o.orderNumber, o.id)}?`}
        description="Captured payments are refunded through the gateway, units return to batches that have not expired, and the customer is emailed."
        confirmLabel="Cancel order"
        tone="danger"
        busy={busy}
        error={error}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() =>
          reason.trim().length >= 3 ? cancel() : setError('Give a reason (at least 3 characters).')
        }
      >
        <FormField label="Reason (sent to the customer)" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </>
  );
}
