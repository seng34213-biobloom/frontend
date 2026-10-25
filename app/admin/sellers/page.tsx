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
  Textarea,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, errorMessage, qs } from '../../lib/admin/api';
import { fmtDate } from '../../lib/admin/format';
import type { SellerRow } from '../../lib/admin/types';
import { useResource } from '../../lib/admin/use-resource';

type Action = { kind: 'reject' | 'suspend'; seller: SellerRow } | null;

/** Seller approval queue and account control (DDP-#10, SRS FR001–FR002). */
export default function SellersPage() {
  const [status, setStatus] = useState('PENDING');
  const sellers = useResource(
    () =>
      adminApi<Array<SellerRow & { _count?: { products: number } }>>(
        'GET',
        `/api/admin/sellers${qs({ status })}`,
      ),
    [status],
  );
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(path: string, body?: unknown, done?: string) {
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', path, body);
      setNotice(done ?? 'Saved.');
      setAction(null);
      setReason('');
      await sellers.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Sellers"
        description="Approve applications and manage seller accounts. Every decision is audited."
      />
      <div className="mb-4 max-w-xs">
        <FormField label="Show">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Pending applications</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All sellers</option>
          </Select>
        </FormField>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !action ? <Alert tone="error">{error}</Alert> : null}
      {sellers.error ? <Alert tone="error">{sellers.error}</Alert> : null}
      {sellers.loading && !sellers.data ? <Spinner label="Loading sellers" /> : null}
      {sellers.data ? (
        <Table caption="Sellers">
          <TableHead>
            <tr>
              <Th>Business</Th>
              <Th>Contact</Th>
              <Th>Applied</Th>
              <Th>Status</Th>
              <Th align="right">Products</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {sellers.data.length === 0 ? (
              <EmptyRow colSpan={6}>No sellers in this list.</EmptyRow>
            ) : (
              sellers.data.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <div className="font-semibold">{s.businessName}</div>
                    {s.rejectionReason ? (
                      <div className="text-forest-500 text-xs">Reason: {s.rejectionReason}</div>
                    ) : null}
                  </Td>
                  <Td>
                    <div>{s.contactName}</div>
                    <div className="text-forest-500 text-xs">
                      {s.email} · {s.phone}
                    </div>
                  </Td>
                  <Td>{fmtDate(s.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td align="right">{s._count?.products ?? '—'}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      {s.status === 'PENDING' ? (
                        <>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                `/api/admin/sellers/${s.id}/approve`,
                                undefined,
                                `${s.businessName} approved and emailed.`,
                              )
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setAction({ kind: 'reject', seller: s })}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {s.status === 'APPROVED' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setAction({ kind: 'suspend', seller: s })}
                        >
                          Suspend
                        </Button>
                      ) : null}
                      {s.status === 'SUSPENDED' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void run(
                              `/api/admin/sellers/${s.id}/reinstate`,
                              undefined,
                              `${s.businessName} reinstated.`,
                            )
                          }
                        >
                          Reinstate
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}

      <ConfirmDialog
        open={action !== null}
        title={
          action?.kind === 'reject'
            ? `Reject ${action.seller.businessName}?`
            : `Suspend ${action?.seller.businessName}?`
        }
        description={
          action?.kind === 'suspend'
            ? 'The seller can no longer sign in and their products leave the catalogue until reinstated.'
            : 'The applicant is told the reason by email.'
        }
        confirmLabel={action?.kind === 'reject' ? 'Reject' : 'Suspend'}
        tone="danger"
        busy={busy}
        error={error}
        onCancel={() => {
          setAction(null);
          setError(null);
        }}
        onConfirm={() => {
          if (!action) return;
          if (reason.trim().length < 1) return setError('Give a reason.');
          void run(
            `/api/admin/sellers/${action.seller.id}/${action.kind}`,
            { reason: reason.trim() },
            'Done.',
          );
        }}
      >
        <FormField label="Reason" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </>
  );
}
