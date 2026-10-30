'use client';

import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  EmptyRow,
  FormField,
  Input,
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
import { adminApi, errorMessage } from '../../lib/admin/api';
import { fmtDate, fmtMoney } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

interface Promo {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minOrderLkr: string | null;
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const EMPTY = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE' as Promo['discountType'],
  discountValue: '',
  minOrderLkr: '',
  validFrom: today(),
  validUntil: inDays(30),
  maxUses: '',
};

/** SDS §6.3 discount codes applied at checkout. */
export default function PromoCodesPage() {
  const promos = useResource(() => adminApi<Promo[]>('GET', '/api/admin/promo-codes'), []);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', '/api/admin/promo-codes', {
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: form.discountValue,
        minOrderLkr: form.minOrderLkr || undefined,
        validFrom: new Date(`${form.validFrom}T00:00:00Z`).toISOString(),
        validUntil: new Date(`${form.validUntil}T23:59:59Z`).toISOString(),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      });
      setNotice(`Code ${form.code.toUpperCase()} created.`);
      setForm(EMPTY);
      await promos.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: Promo) {
    setError(null);
    try {
      await adminApi('PATCH', `/api/admin/promo-codes/${p.id}`, { active: !p.active });
      await promos.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Promo codes"
        description="Discounts apply to the item subtotal, never to shipping."
      />
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {promos.error ? <Alert tone="error">{promos.error}</Alert> : null}
      {promos.loading && !promos.data ? <Spinner label="Loading promo codes" /> : null}
      {promos.data ? (
        <Table caption="Promo codes">
          <TableHead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Minimum order</Th>
              <Th>Valid</Th>
              <Th align="right">Used</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {promos.data.length === 0 ? (
              <EmptyRow colSpan={7}>No promo codes.</EmptyRow>
            ) : (
              promos.data.map((p) => (
                <tr key={p.id}>
                  <Td className="font-mono font-semibold">
                    {p.code}
                    {p.description ? (
                      <div className="text-forest-500 font-sans text-xs font-normal">
                        {p.description}
                      </div>
                    ) : null}
                  </Td>
                  <Td>
                    {p.discountType === 'PERCENTAGE'
                      ? `${Number(p.discountValue)}%`
                      : fmtMoney(p.discountValue)}
                  </Td>
                  <Td>{p.minOrderLkr ? fmtMoney(p.minOrderLkr) : '—'}</Td>
                  <Td>
                    {fmtDate(p.validFrom)} – {fmtDate(p.validUntil)}
                  </Td>
                  <Td align="right">
                    {p.usedCount}
                    {p.maxUses ? ` / ${p.maxUses}` : ''}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={p.active ? 'ACTIVE' : 'CANCELLED'}
                      label={p.active ? 'Active' : 'Inactive'}
                    />
                  </Td>
                  <Td align="right">
                    <Button size="sm" variant="secondary" onClick={() => void toggle(p)}>
                      {p.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}

      <form onSubmit={create} className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3" noValidate>
        <h2 className="font-serif text-xl sm:col-span-3">New promo code</h2>
        <FormField label="Code" required hint="3–32 letters, digits, - or _">
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </FormField>
        <FormField label="Type" required>
          <Select
            value={form.discountType}
            onChange={(e) =>
              setForm({ ...form, discountType: e.target.value as Promo['discountType'] })
            }
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount (LKR)</option>
          </Select>
        </FormField>
        <FormField label={form.discountType === 'PERCENTAGE' ? 'Percent off' : 'LKR off'} required>
          <Input
            inputMode="decimal"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
          />
        </FormField>
        <FormField label="Valid from" required>
          <Input
            type="date"
            value={form.validFrom}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
          />
        </FormField>
        <FormField label="Valid until" required>
          <Input
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
        </FormField>
        <FormField label="Maximum uses" hint="Empty for unlimited">
          <Input
            inputMode="numeric"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
        </FormField>
        <FormField label="Minimum order (LKR)">
          <Input
            inputMode="decimal"
            value={form.minOrderLkr}
            onChange={(e) => setForm({ ...form, minOrderLkr: e.target.value })}
          />
        </FormField>
        <FormField label="Description" className="sm:col-span-2">
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create code'}
          </Button>
        </div>
      </form>
    </>
  );
}
