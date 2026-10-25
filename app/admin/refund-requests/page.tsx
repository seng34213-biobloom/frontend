'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyRow,
  FormField,
  Select,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Textarea,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, errorMessage, qs } from '../../lib/admin/api';
import { fmtDateTime, fmtMoney, fmtOrderNumber } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface RefundRow {
  id: string;
  amount: string;
  reason: string;
  status: string;
  createdAt: string;
  customer: { name: string; email: string };
  order: { id: string; orderNumber: number; totalAmount: string; status: string };
}

/** DDP-#26 — approve (full or partial, optional restock) or reject refund requests. */
export default function RefundRequestsPage() {
  const [status, setStatus] = useState('REQUESTED');
  const rows = useResource(
    () => adminApi<RefundRow[]>('GET', `/api/admin/refund-requests${qs({ status })}`),
    [status],
  );
  const [approve, setApprove] = useState<RefundRow | null>(null);
  const [reject, setReject] = useState<RefundRow | null>(null);
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function send(path: string, body: unknown, done: string) {
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', path, body);
      setApprove(null);
      setReject(null);
      setReason('');
      setNotice(done);
      await rows.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Refund requests"
        description="Refunds are issued through the payment gateway on approval."
      />
      <div className="mb-4 max-w-xs">
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="REQUESTED">Waiting for a decision</option>
            <option value="PROCESSED">Refunded</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </Select>
        </FormField>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {rows.error ? <Alert tone="error">{rows.error}</Alert> : null}
      {rows.loading && !rows.data ? <Spinner label="Loading refund requests" /> : null}
      {rows.data ? (
        <Table caption="Refund requests">
          <TableHead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Requested</Th>
              <Th align="right">Amount</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {rows.data.length === 0 ? (
              <EmptyRow colSpan={7}>Nothing here.</EmptyRow>
            ) : (
              rows.data.map((r) => {
                const partial = Number(r.amount) < Number(r.order.totalAmount);
                return (
                  <tr key={r.id}>
                    <Td>
                      <Link href={`/orders/${r.order.id}`} className="underline">
                        {fmtOrderNumber(r.order.orderNumber, r.order.id)}
                      </Link>
                    </Td>
                    <Td>
                      {r.customer.name}
                      <div className="text-forest-500 text-xs">{r.customer.email}</div>
                    </Td>
                    <Td>{fmtDateTime(r.createdAt)}</Td>
                    <Td align="right">
                      {fmtMoney(r.amount)}
                      <div className="text-forest-500 text-xs">
                        {partial ? `partial of ${fmtMoney(r.order.totalAmount)}` : 'full order'}
                      </div>
                    </Td>
                    <Td>{r.reason}</Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td align="right">
                      {r.status === 'REQUESTED' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRestock(!partial);
                              setError(null);
                              setApprove(r);
                            }}
                          >
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setReject(r)}>
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </Td>
                  </tr>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : null}

      <ConfirmDialog
        open={approve !== null}
        title={`Refund ${approve ? fmtMoney(approve.amount) : ''}?`}
        description="The amount is refunded through the original gateway and the customer is emailed."
        confirmLabel="Approve refund"
        busy={busy}
        error={error}
        onCancel={() => setApprove(null)}
        onConfirm={() =>
          approve
            ? send(
                `/api/admin/refund-requests/${approve.id}/approve`,
                { restock },
                'Refund issued.',
              )
            : undefined
        }
      >
        <Checkbox
          label="Return the units to stock (only batches that have not expired)"
          checked={restock}
          onChange={(e) => setRestock(e.target.checked)}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={reject !== null}
        title="Reject this refund request?"
        confirmLabel="Reject"
        tone="danger"
        busy={busy}
        error={error}
        onCancel={() => setReject(null)}
        onConfirm={() => {
          if (!reject) return;
          if (!reason.trim()) return setError('Tell the customer why.');
          void send(
            `/api/admin/refund-requests/${reject.id}/reject`,
            { reason: reason.trim() },
            'Request rejected.',
          );
        }}
      >
        <FormField label="Reason (emailed to the customer)" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </>
  );
}
