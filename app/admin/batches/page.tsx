'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../components/button';

/**
 * SDS §6.6 batch management screen. Shows all batches for a product sorted
 * earliest-expiry-first with colour-coded BatchStatus badges. Inline form
 * creates a new batch against a chosen variant.
 *
 * Auth: relies on the admin/seller already having an auth_token cookie set.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

type BatchStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'DEPLETED';

interface BatchRow {
  id: string;
  batchNumber: string;
  manufacturedDate: string;
  expiryDate: string;
  initialQuantity: number;
  currentQuantity: number;
  status: BatchStatus;
  variant: { id: string; sku: string; size: string; name: string };
}

const STATUS_BADGE: Record<BatchStatus, string> = {
  ACTIVE: 'bg-brand-100 text-brand-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-danger-50 text-danger-700',
  DEPLETED: 'bg-cream-200 text-forest-500',
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<string> {
  const existing = readCookie('csrf-token');
  if (existing) return existing;
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' });
  const fresh = readCookie('csrf-token');
  if (fresh) return fresh;
  return ((await res.json()) as { csrfToken: string }).csrfToken;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BatchesPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const [rows, setRows] = useState<BatchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}/batches`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setError('Not authenticated — log in first.');
        setRows([]);
        return;
      }
      if (res.status === 403) {
        setError('Forbidden — your account cannot manage this product.');
        setRows([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setRows((await res.json()) as BatchRow[]);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitNewBatch(form: FormData) {
    const variantId = String(form.get('variantId') ?? '').trim();
    if (!variantId) {
      alert('Variant ID required');
      return;
    }
    setSubmitting(true);
    try {
      const csrf = await ensureCsrf();
      const res = await fetch(
        `${API_BASE}/api/admin/products/${productId}/variants/${variantId}/batches`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body: JSON.stringify({
            batchNumber: String(form.get('batchNumber') ?? '').trim(),
            manufacturedDate: String(form.get('manufacturedDate') ?? ''),
            expiryDate: String(form.get('expiryDate') ?? ''),
            initialQuantity: Number(form.get('initialQuantity') ?? 0),
          }),
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? `Create failed (${res.status})`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Distinct variants from current rows for the create form's dropdown.
  const variants = rows
    ? Array.from(new Map(rows.map((r) => [r.variant.id, r.variant])).values())
    : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <span className="rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
          Batch management
        </span>
        <h1 className="font-serif text-4xl text-forest-700">Product batches</h1>
        <p className="text-forest-500">
          Sorted earliest-expiry first. Orders draw down stock from the top of this list.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-danger-300 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {rows === null ? (
        <p className="text-forest-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-forest-500">No batches yet — create the first one below.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-200 bg-cream-50">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-xs uppercase tracking-widest text-forest-500">
              <tr>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Manufactured</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-forest-700">{b.variant.size}</span>
                    <span className="ml-1 text-xs text-forest-400">{b.variant.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-forest-500">{fmtDate(b.manufacturedDate)}</td>
                  <td className="px-4 py-3 text-forest-700">{fmtDate(b.expiryDate)}</td>
                  <td className="px-4 py-3 text-right">
                    {b.currentQuantity}
                    <span className="text-forest-400"> / {b.initialQuantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGE[b.status]}`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-forest-700">Add a batch</h2>
        <form action={submitNewBatch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
              Variant
            </span>
            {variants.length > 0 ? (
              <select
                name="variantId"
                required
                className="block w-full rounded-lg border border-cream-300 bg-white px-3 py-2"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.size} ({v.sku})
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="variantId"
                placeholder="Variant UUID"
                required
                className="block w-full rounded-lg border border-cream-300 bg-white px-3 py-2"
              />
            )}
          </label>
          <Field name="batchNumber" label="Batch number" placeholder="BATCH-2026-001" required />
          <Field name="manufacturedDate" type="date" label="Manufactured" required />
          <Field name="expiryDate" type="date" label="Expiry" required />
          <Field
            name="initialQuantity"
            type="number"
            label="Quantity"
            min={1}
            required
            placeholder="50"
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create batch'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field(props: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
        {props.label}
      </span>
      <input
        name={props.name}
        type={props.type ?? 'text'}
        placeholder={props.placeholder}
        required={props.required}
        min={props.min}
        className="block w-full rounded-lg border border-cream-300 bg-white px-3 py-2"
      />
    </label>
  );
}
