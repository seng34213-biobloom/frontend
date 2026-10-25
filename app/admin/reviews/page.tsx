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
import { adminApi, errorMessage, qs } from '../../lib/admin/api';
import { fmtDate } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  customer: { name: string; email: string };
  product: { name: string; slug: string };
}

/** DDP-#27 — reviews stay hidden until approved; rejected reviews are deleted (audited). */
export default function ReviewsPage() {
  const [approved, setApproved] = useState('false');
  const rows = useResource(
    () => adminApi<ReviewRow[]>('GET', `/api/admin/reviews${qs({ approved })}`),
    [approved],
  );
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    try {
      await adminApi('POST', `/api/admin/reviews/${id}/${action}`);
      await rows.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Review moderation"
        description="Only customers with a delivered order can review a product."
      />
      <div className="mb-4 max-w-xs">
        <FormField label="Show">
          <Select value={approved} onChange={(e) => setApproved(e.target.value)}>
            <option value="false">Waiting for moderation</option>
            <option value="true">Published</option>
          </Select>
        </FormField>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {rows.error ? <Alert tone="error">{rows.error}</Alert> : null}
      {rows.loading && !rows.data ? <Spinner label="Loading reviews" /> : null}
      {rows.data ? (
        <Table caption="Reviews">
          <TableHead>
            <tr>
              <Th>Product</Th>
              <Th>Customer</Th>
              <Th>Rating</Th>
              <Th>Comment</Th>
              <Th>Date</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {rows.data.length === 0 ? (
              <EmptyRow colSpan={6}>No reviews here.</EmptyRow>
            ) : (
              rows.data.map((r) => (
                <tr key={r.id}>
                  <Td>{r.product.name}</Td>
                  <Td>{r.customer.name}</Td>
                  <Td>
                    <span aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </span>
                  </Td>
                  <Td className="max-w-md">{r.comment}</Td>
                  <Td>{fmtDate(r.createdAt)}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      {!r.approved ? (
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => void act(r.id, 'approve')}
                        >
                          Approve
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === r.id}
                        onClick={() => void act(r.id, 'reject')}
                      >
                        {r.approved ? 'Remove' : 'Reject'}
                      </Button>
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
