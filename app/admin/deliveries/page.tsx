'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Alert,
  EmptyRow,
  FormField,
  Select,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, qs, rowsOf, type Paginated } from '../../lib/admin/api';
import { fmtDateTime, fmtOrderNumber } from '../../lib/admin/format';
import type { DeliveryAssignment } from '../../lib/admin/types';
import { useResource } from '../../lib/admin/use-resource';

const STATUSES = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];

export default function DeliveriesPage() {
  const [status, setStatus] = useState('');
  const rows = useResource(
    () =>
      adminApi<DeliveryAssignment[] | Paginated<DeliveryAssignment>>(
        'GET',
        `/api/admin/delivery-assignments${qs({ status })}`,
      ).then(rowsOf),
    [status],
  );

  return (
    <>
      <PageHeader
        title="Delivery assignments"
        description="Rider progress for shipped orders. Failed deliveries can be re-assigned from the fulfilment queue."
      />
      <div className="mb-4 max-w-xs">
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      {rows.error ? <Alert tone="error">{rows.error}</Alert> : null}
      {rows.loading && !rows.data ? <Spinner label="Loading assignments" /> : null}
      {rows.data ? (
        <Table caption="Delivery assignments">
          <TableHead>
            <tr>
              <Th>Order</Th>
              <Th>Rider</Th>
              <Th>Status</Th>
              <Th>Attempt</Th>
              <Th>Assigned</Th>
              <Th>Delivered</Th>
              <Th>Notes</Th>
            </tr>
          </TableHead>
          <TableBody>
            {rows.data.length === 0 ? (
              <EmptyRow colSpan={7}>No assignments.</EmptyRow>
            ) : (
              rows.data.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <Link href={`/admin/orders/${a.orderId}`} className="underline">
                      {fmtOrderNumber(a.order?.orderNumber, a.orderId)}
                    </Link>
                  </Td>
                  <Td>{a.deliveryUser?.name ?? '—'}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td>{a.attempts ?? 1}</Td>
                  <Td>{fmtDateTime(a.assignedAt)}</Td>
                  <Td>{fmtDateTime(a.deliveredAt)}</Td>
                  <Td>
                    {a.failureReason ?? a.notes ?? ''}
                    {a.proofPhotoUrl ? (
                      <a
                        href={a.proofPhotoUrl}
                        className="ml-1 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Proof photo
                      </a>
                    ) : null}
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}
    </>
  );
}
