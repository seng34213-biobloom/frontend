'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyRow,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
} from '@biobloom/ui';
import { adminApi } from '../../lib/admin/api';
import { fmtDateTime, fmtMoney, fmtOrderNumber } from '../../lib/admin/format';
import type { DeliveryAssignment, QueueOrder } from '../../lib/admin/types';
import { useConfirm } from '../../lib/admin/use-confirm';
import { useResource } from '../../lib/admin/use-resource';
import { AssignRiderDialog } from './AssignRiderDialog';
import { StatusBadge } from './StatusBadge';

interface QueueData {
  open: QueueOrder[];
  shipped: QueueOrder[];
  assignments: Map<string, DeliveryAssignment>;
}

type Flip = { order: QueueOrder; to: 'packing' | 'shipped' };

/**
 * Fulfilment work queue (DDP-#26): PAID/PACKING orders oldest first with
 * the packing and shipped flips, then SHIPPED orders with their delivery
 * assignment so staff can assign a rider or retry a FAILED delivery.
 * Shared by the fulfilment page and the fulfilment-staff dashboard.
 */
export function FulfilmentQueue({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<QueueOrder | null>(null);
  const flip = useConfirm<Flip>();

  const queue = useResource<QueueData>(async () => {
    const [open, shipped, assignments] = await Promise.all([
      adminApi<QueueOrder[]>('GET', '/api/admin/fulfilment/open'),
      adminApi<QueueOrder[]>('GET', '/api/admin/fulfilment/shipped'),
      adminApi<DeliveryAssignment[]>('GET', '/api/admin/delivery-assignments'),
    ]);
    return { open, shipped, assignments: new Map(assignments.map((a) => [a.orderId, a])) };
  }, []);

  const H = headingLevel === 2 ? 'h2' : 'h3';
  const label = (o: QueueOrder) => `Order ${fmtOrderNumber(o.orderNumber, o.id)}`;

  return (
    <div className="space-y-8">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {queue.error ? <Alert tone="error">{queue.error}</Alert> : null}

      <section aria-labelledby="queue-open" className="space-y-3">
        <H id="queue-open" className="text-forest-700 font-serif text-2xl">
          Ready to pack and ship
        </H>
        <Table caption="Paid and packing orders, oldest first">
          <TableHead>
            <tr>
              <Th>Order</Th>
              <Th>Placed</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </tr>
          </TableHead>
          <TableBody>
            {queue.data === null ? (
              <EmptyRow colSpan={6}>
                {queue.loading ? <Spinner label="Loading queue…" /> : 'Queue unavailable.'}
              </EmptyRow>
            ) : queue.data.open.length === 0 ? (
              <EmptyRow colSpan={6}>No orders waiting. Nice work.</EmptyRow>
            ) : (
              queue.data.open.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-brand-700 font-semibold underline"
                    >
                      {fmtOrderNumber(o.orderNumber, o.id)}
                    </Link>
                    <p className="text-forest-500 text-xs">{fmtMoney(o.totalAmount)}</p>
                  </Td>
                  <Td>{fmtDateTime(o.placedAt)}</Td>
                  <Td>
                    {o.customer?.name}
                    {o.shippingAddress ? (
                      <p className="text-forest-500 text-xs">
                        {o.shippingAddress.city}, {o.shippingAddress.district}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <ul className="space-y-0.5 text-xs">
                      {(o.items ?? []).map((it) => (
                        <li key={it.id}>
                          {it.quantity} ×{' '}
                          {it.variant
                            ? `${it.variant.name} ${it.variant.size}`
                            : (it.bundle?.name ?? 'Item')}
                          {it.variant ? (
                            <span className="text-forest-500"> ({it.variant.sku})</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td align="right">
                    {o.status === 'PAID' ? (
                      <Button size="sm" onClick={() => flip.open({ order: o, to: 'packing' })}>
                        Mark packing<span className="sr-only"> for {label(o)}</span>
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => flip.open({ order: o, to: 'shipped' })}>
                        Mark shipped<span className="sr-only"> for {label(o)}</span>
                      </Button>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby="queue-shipped" className="space-y-3">
        <H id="queue-shipped" className="text-forest-700 font-serif text-2xl">
          Shipped, awaiting delivery
        </H>
        <Table caption="Shipped orders and their delivery assignment">
          <TableHead>
            <tr>
              <Th>Order</Th>
              <Th>Shipped</Th>
              <Th>Customer</Th>
              <Th>Delivery</Th>
              <Th align="right">Action</Th>
            </tr>
          </TableHead>
          <TableBody>
            {queue.data === null ? (
              <EmptyRow colSpan={5}>
                {queue.loading ? <Spinner label="Loading shipped orders…" /> : 'Unavailable.'}
              </EmptyRow>
            ) : queue.data.shipped.length === 0 ? (
              <EmptyRow colSpan={5}>No shipped orders awaiting delivery.</EmptyRow>
            ) : (
              queue.data.shipped.map((o) => {
                const a = queue.data?.assignments.get(o.id);
                return (
                  <tr key={o.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-brand-700 font-semibold underline"
                      >
                        {fmtOrderNumber(o.orderNumber, o.id)}
                      </Link>
                    </Td>
                    <Td>{fmtDateTime(o.shippedAt)}</Td>
                    <Td>
                      {o.customer?.name}
                      {o.shippingAddress ? (
                        <p className="text-forest-500 text-xs">
                          {o.shippingAddress.line1}, {o.shippingAddress.city}
                        </p>
                      ) : null}
                    </Td>
                    <Td>
                      {a ? (
                        <div className="space-y-1">
                          <StatusBadge status={a.status} />
                          <p className="text-forest-600 text-xs">
                            {a.deliveryUser?.name ?? 'Rider'}
                            {a.attempts && a.attempts > 1 ? ` · attempt ${a.attempts}` : ''}
                          </p>
                          {a.status === 'FAILED' && a.failureReason ? (
                            <p className="text-danger-700 text-xs">Reason: {a.failureReason}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-forest-500 text-sm">Not assigned</span>
                      )}
                    </Td>
                    <Td align="right">
                      {!a || a.status === 'FAILED' ? (
                        <Button
                          size="sm"
                          variant={a ? 'secondary' : 'primary'}
                          onClick={() => setAssignFor(o)}
                        >
                          {a ? 'Re-assign' : 'Assign rider'}
                          <span className="sr-only"> for {label(o)}</span>
                        </Button>
                      ) : null}
                    </Td>
                  </tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      <ConfirmDialog
        open={flip.isOpen}
        title={
          flip.target
            ? `Mark ${label(flip.target.order)} as ${flip.target.to === 'packing' ? 'packing' : 'shipped'}?`
            : ''
        }
        description={
          flip.target?.to === 'shipped'
            ? 'The customer is emailed that the order has shipped. This step is recorded in the audit log.'
            : 'The order moves to Packing. This step is recorded in the audit log.'
        }
        confirmLabel={flip.target?.to === 'shipped' ? 'Mark shipped' : 'Mark packing'}
        busy={flip.busy}
        error={flip.error}
        onCancel={flip.close}
        onConfirm={() =>
          flip.run(async ({ order, to }) => {
            await adminApi('POST', `/api/admin/fulfilment/orders/${order.id}/${to}`);
            setNotice(`${label(order)} marked ${to}.`);
            await queue.reload();
          })
        }
      />

      <AssignRiderDialog
        orderId={assignFor?.id ?? null}
        orderLabel={assignFor ? label(assignFor) : ''}
        current={assignFor ? queue.data?.assignments.get(assignFor.id) : null}
        onClose={() => setAssignFor(null)}
        onAssigned={(message) => {
          setAssignFor(null);
          setNotice(message);
          void queue.reload();
        }}
      />
    </div>
  );
}
