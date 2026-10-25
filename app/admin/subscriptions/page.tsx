'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  ConfirmDialog,
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
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, errorMessage, qs, type Paginated } from '../../lib/admin/api';
import { fmtDate, fmtMoney } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface SubscriptionRow {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  frequencyDays: number;
  quantity: number;
  discountRate: string;
  nextBillingDate: string;
  discountedUnitPrice: string;
  paymentGateway: string;
  product: { name: string };
  variant: { name: string; size: string };
  customer: { name: string; email: string };
}

/** SDS §7.5 / §6.7 — admin oversight of Subscribe & Save. */
type BillingRun = {
  due: number;
  renewed: number;
  outOfStock: number;
  chargeFailed: number;
  durationMs: number;
};

export default function SubscriptionsPage() {
  const [status, setStatus] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const subs = useResource(
    () =>
      adminApi<Paginated<SubscriptionRow>>(
        'GET',
        `/api/admin/subscriptions${qs({ status, page, pageSize: 25 })}`,
      ),
    [status, page],
  );
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<SubscriptionRow | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  // Local and test environments only: the API answers 404 in production,
  // where the 06:00 UTC cron is the only trigger.
  async function runBilling() {
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const r = await adminApi<BillingRun>('POST', '/api/admin/subscriptions/billing/run');
      setRunResult(
        `Billing run finished in ${(r.durationMs / 1000).toFixed(1)} s: ${r.due} due, ${r.renewed} renewed, ` +
          `${r.chargeFailed} declined, ${r.outOfStock} out of stock.`,
      );
      await subs.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRunning(false);
    }
  }

  async function act(id: string, action: 'pause' | 'resume' | 'cancel') {
    setBusyId(id);
    setError(null);
    try {
      await adminApi('PATCH', `/api/admin/subscriptions/${id}/${action}`);
      await subs.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
      setCancelling(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Subscribe & Save plans across all customers."
        actions={
          <Button variant="secondary" disabled={running} onClick={() => void runBilling()}>
            {running ? 'Running…' : 'Run billing now'}
          </Button>
        }
      />
      {runResult ? <Alert tone="success">{runResult}</Alert> : null}
      <div className="mb-4 max-w-xs">
        <FormField label="Status">
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="">All</option>
          </Select>
        </FormField>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {subs.error ? <Alert tone="error">{subs.error}</Alert> : null}
      {subs.loading && !subs.data ? <Spinner label="Loading subscriptions" /> : null}
      {subs.data ? (
        <>
          <Table caption="Subscriptions">
            <TableHead>
              <tr>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th>Every</Th>
                <Th align="right">Per delivery</Th>
                <Th>Next billing</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </TableHead>
            <TableBody>
              {subs.data.items.length === 0 ? (
                <EmptyRow colSpan={7}>No subscriptions.</EmptyRow>
              ) : (
                subs.data.items.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      {s.customer.name}
                      <div className="text-forest-500 text-xs">{s.customer.email}</div>
                    </Td>
                    <Td>
                      {s.quantity} × {s.product.name} ({s.variant.size})
                    </Td>
                    <Td>{s.frequencyDays} days</Td>
                    <Td align="right">{fmtMoney(Number(s.discountedUnitPrice) * s.quantity)}</Td>
                    <Td>{s.status === 'CANCELLED' ? '—' : fmtDate(s.nextBillingDate)}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td align="right">
                      {s.status !== 'CANCELLED' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === s.id}
                            onClick={() =>
                              void act(s.id, s.status === 'ACTIVE' ? 'pause' : 'resume')
                            }
                          >
                            {s.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busyId === s.id}
                            onClick={() => setCancelling(s)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}
                    </Td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={subs.data.page}
            pageSize={subs.data.pageSize}
            total={subs.data.total}
            onPage={setPage}
          />
        </>
      ) : null}
      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this subscription now?"
        description="Cancellation is immediate and the customer receives a confirmation email (SDS §7.5)."
        confirmLabel="Cancel subscription"
        tone="danger"
        busy={busyId !== null}
        error={error}
        onCancel={() => setCancelling(null)}
        onConfirm={() => (cancelling ? act(cancelling.id, 'cancel') : undefined)}
      />
    </>
  );
}
