'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
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
import { adminApi, errorMessage, qs } from '../../lib/admin/api';
import { fmtDateTime } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  customer: { name: string; email: string };
}

/** DDP-#27 — customer support tickets: resolve (customer may reopen) or close (final). */
export default function SupportPage() {
  const [status, setStatus] = useState('OPEN');
  const rows = useResource(
    () => adminApi<Ticket[]>('GET', `/api/admin/support/tickets${qs({ status })}`),
    [status],
  );
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: 'resolve' | 'close') {
    setBusyId(id);
    setError(null);
    try {
      await adminApi('POST', `/api/admin/support/tickets/${id}/${action}`);
      await rows.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Support tickets" />
      <div className="mb-4 max-w-xs">
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="">All</option>
          </Select>
        </FormField>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {rows.error ? <Alert tone="error">{rows.error}</Alert> : null}
      {rows.loading && !rows.data ? <Spinner label="Loading tickets" /> : null}
      {rows.data ? (
        <Table caption="Support tickets">
          <TableHead>
            <tr>
              <Th>Customer</Th>
              <Th>Subject</Th>
              <Th>Message</Th>
              <Th>Opened</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {rows.data.length === 0 ? (
              <EmptyRow colSpan={6}>No tickets.</EmptyRow>
            ) : (
              rows.data.map((t) => (
                <tr key={t.id}>
                  <Td>
                    {t.customer.name}
                    <div className="text-forest-500 text-xs">{t.customer.email}</div>
                  </Td>
                  <Td className="font-semibold">{t.subject}</Td>
                  <Td className="max-w-md whitespace-pre-line">{t.message}</Td>
                  <Td>{fmtDateTime(t.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      {t.status === 'OPEN' || t.status === 'IN_PROGRESS' ? (
                        <Button
                          size="sm"
                          disabled={busyId === t.id}
                          onClick={() => void act(t.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                      ) : null}
                      {t.status !== 'CLOSED' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === t.id}
                          onClick={() => void act(t.id, 'close')}
                        >
                          Close
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
    </>
  );
}
