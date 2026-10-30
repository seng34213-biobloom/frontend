'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '../components/Alert';
import { Badge, type BadgeTone } from '../components/Badge';
import { Button } from '../components/Button';
import { FormField, Input, Select } from '../components/FormField';
import { Spinner } from '../components/Spinner';
import { EmptyRow, Table, TableBody, TableHead, Td, Th } from '../components/Table';
import { type CatalogueClient, day, message, useLoad } from './client';

type BatchStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'DEPLETED';

interface BatchesView {
  product: { id: string; name: string; slug: string; active: boolean };
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    size: string;
    active: boolean;
    available: number;
  }>;
  batches: Array<{
    id: string;
    batchNumber: string;
    manufacturedDate: string;
    expiryDate: string;
    initialQuantity: number;
    currentQuantity: number;
    status: BatchStatus;
    displayStatus: BatchStatus;
    daysUntilExpiry: number;
    variant: { id: string; sku: string; size: string; name: string };
  }>;
}

/** SDS §6.6 colours: red expired, amber expiring within seven days, green active. */
const BADGE: Record<BatchStatus, { tone: BadgeTone; label: string }> = {
  ACTIVE: { tone: 'success', label: 'Active' },
  EXPIRING_SOON: { tone: 'warning', label: 'Expiring soon' },
  EXPIRED: { tone: 'danger', label: 'Expired' },
  DEPLETED: { tone: 'neutral', label: 'Depleted' },
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Batch management (SDS §6.6, DDP-#13): batches listed earliest expiry first
 * with status badges, and an add-batch form whose API errors (date rules,
 * duplicate batch number) appear beside the form.
 */
export function BatchManager({
  client,
  productId,
}: {
  client: CatalogueClient;
  productId: string;
}) {
  const view = useLoad(
    () => client.request<BatchesView>('GET', `/api/admin/products/${productId}/batches`),
    productId,
  );
  const [variantId, setVariantId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturedDate, setManufacturedDate] = useState(today());
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (view.error) return <Alert tone="error">{view.error}</Alert>;
  if (!view.data) return <Spinner label="Loading batches" />;
  const data = view.data;
  const chosen = variantId || data.variants.find((v) => v.active)?.id || '';

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!chosen) return setError('Add a variant to this product first.');
    if (!batchNumber.trim()) return setError('Enter the batch number printed on the jars.');
    if (!(Number.isInteger(Number(quantity)) && Number(quantity) >= 1))
      return setError('Quantity must be at least 1.');
    setBusy(true);
    try {
      await client.request('POST', `/api/admin/products/${productId}/variants/${chosen}/batches`, {
        batchNumber: batchNumber.trim(),
        manufacturedDate,
        expiryDate,
        initialQuantity: Number(quantity),
      });
      setNotice(`Batch ${batchNumber.trim()} added.`);
      setBatchNumber('');
      setQuantity('');
      setExpiryDate('');
      await view.reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-forest-600 text-sm">
        {data.product.name} · stock per variant:{' '}
        {data.variants.map((v) => `${v.size} ${v.available}`).join(' · ') || 'no variants'}
      </p>
      <Table caption={`Batches for ${data.product.name}, earliest expiry first`}>
        <TableHead>
          <tr>
            <Th>Batch</Th>
            <Th>Variant</Th>
            <Th>Manufactured</Th>
            <Th>Expires</Th>
            <Th align="right">Initial</Th>
            <Th align="right">Remaining</Th>
            <Th>Status</Th>
          </tr>
        </TableHead>
        <TableBody>
          {data.batches.length === 0 ? (
            <EmptyRow colSpan={7}>No batches yet. Add the first one below.</EmptyRow>
          ) : (
            data.batches.map((b) => (
              <tr key={b.id}>
                <Td className="font-mono text-xs">{b.batchNumber}</Td>
                <Td>
                  {b.variant.name} ({b.variant.size})
                </Td>
                <Td>{day(b.manufacturedDate)}</Td>
                <Td>
                  {day(b.expiryDate)}
                  {b.displayStatus !== 'EXPIRED' && b.displayStatus !== 'DEPLETED' ? (
                    <span className="text-forest-500 ml-1 text-xs">({b.daysUntilExpiry} d)</span>
                  ) : null}
                </Td>
                <Td align="right">{b.initialQuantity}</Td>
                <Td align="right">{b.currentQuantity}</Td>
                <Td>
                  <Badge tone={BADGE[b.displayStatus].tone}>{BADGE[b.displayStatus].label}</Badge>
                </Td>
              </tr>
            ))
          )}
        </TableBody>
      </Table>

      <form
        onSubmit={add}
        className="space-y-3 border border-black p-4"
        noValidate
        aria-labelledby="add-batch-h"
      >
        <h2 id="add-batch-h" className="font-semibold">
          Add a batch
        </h2>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        <div className="grid gap-3 sm:grid-cols-5">
          <FormField label="Variant" required>
            <Select value={chosen} onChange={(e) => setVariantId(e.target.value)}>
              {data.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={!v.active}>
                  {v.name} ({v.size}){v.active ? '' : ' — inactive'}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Batch number" required>
            <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
          </FormField>
          <FormField label="Manufactured" required>
            <Input
              type="date"
              max={today()}
              value={manufacturedDate}
              onChange={(e) => setManufacturedDate(e.target.value)}
            />
          </FormField>
          <FormField label="Expiry" required hint="Must be after today.">
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </FormField>
          <FormField label="Quantity" required>
            <Input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add batch'}
        </Button>
      </form>
    </div>
  );
}
