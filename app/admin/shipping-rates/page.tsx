'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  FormField,
  Input,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { adminApi, errorMessage } from '../../lib/admin/api';
import { fmtMoney } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface Rate {
  id: string;
  minWeightG: number;
  maxWeightG: number;
  feeLkr: string;
  label: string;
}

interface Draft {
  minWeightG: string;
  maxWeightG: string;
  feeLkr: string;
  label: string;
}

const toDraft = (r: Rate): Draft => ({
  minWeightG: String(r.minWeightG),
  maxWeightG: String(r.maxWeightG),
  feeLkr: r.feeLkr,
  label: r.label,
});

const toBody = (d: Draft) => ({
  minWeightG: Number(d.minWeightG),
  maxWeightG: Number(d.maxWeightG),
  feeLkr: d.feeLkr,
  label: d.label.trim(),
});

/**
 * DDP-#16 — weight brackets. The API rejects any change that leaves a gap
 * or overlap (the reason is shown here) and refreshes the checkout cache.
 */
export default function ShippingRatesPage() {
  const rates = useResource(() => adminApi<Rate[]>('GET', '/api/admin/shipping-rates'), []);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      if (editing.id)
        await adminApi('PATCH', `/api/admin/shipping-rates/${editing.id}`, toBody(editing.draft));
      else await adminApi('POST', '/api/admin/shipping-rates', toBody(editing.draft));
      setEditing(null);
      await rates.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await adminApi('DELETE', `/api/admin/shipping-rates/${id}`);
      await rates.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof Draft, label: string) =>
    editing ? (
      <FormField label={label}>
        <Input
          value={editing.draft[k]}
          onChange={(e) =>
            setEditing({ ...editing, draft: { ...editing.draft, [k]: e.target.value } })
          }
        />
      </FormField>
    ) : null;

  return (
    <>
      <PageHeader
        title="Shipping rates"
        description="Fees by total order weight. Brackets must start at 0 g and follow on without gaps."
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {rates.error ? <Alert tone="error">{rates.error}</Alert> : null}
      {!rates.data ? (
        <Spinner label="Loading shipping rates" />
      ) : (
        <Table caption="Shipping brackets">
          <TableHead>
            <tr>
              <Th>Label</Th>
              <Th align="right">From (g)</Th>
              <Th align="right">To (g)</Th>
              <Th align="right">Fee</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {rates.data.map((r) => (
              <tr key={r.id}>
                <Td>{r.label}</Td>
                <Td align="right">{r.minWeightG}</Td>
                <Td align="right">{r.maxWeightG}</Td>
                <Td align="right">{fmtMoney(r.feeLkr)}</Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ id: r.id, draft: toDraft(r) })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => void remove(r.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </TableBody>
        </Table>
      )}

      {editing ? (
        <form
          className="border-cream-300 mt-6 grid max-w-3xl items-end gap-3 rounded-xl border bg-white p-4 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          noValidate
        >
          <h2 className="font-semibold sm:col-span-5">
            {editing.id ? 'Edit bracket' : 'New bracket'}
          </h2>
          {field('label', 'Label')}
          {field('minWeightG', 'From (g)')}
          {field('maxWeightG', 'To (g)')}
          {field('feeLkr', 'Fee (LKR)')}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          className="mt-6"
          onClick={() =>
            setEditing({
              id: null,
              draft: { minWeightG: '', maxWeightG: '', feeLkr: '', label: '' },
            })
          }
        >
          Add bracket
        </Button>
      )}
    </>
  );
}
