'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Checkbox, FormField, Input, Select, Textarea } from '../components/FormField';
import { Spinner } from '../components/Spinner';
import { EmptyRow, Table, TableBody, TableHead, Td, Th } from '../components/Table';
import {
  type CatalogueClient,
  type CatalogueProduct,
  type Page,
  lkr,
  message,
  useLoad,
} from './client';

interface BundleRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  componentsTotal: string;
  totalWeightG: number;
  active: boolean;
  available: number;
  seller: { id: string; businessName: string };
  components: Array<{
    productVariantId: string;
    quantity: number;
    variantName: string;
    size: string;
    product: { name: string };
  }>;
}

interface Draft {
  id: string | null;
  name: string;
  description: string;
  price: string;
  totalWeightG: string;
  sellerId: string;
  active: boolean;
  items: Array<{ productVariantId: string; quantity: string }>;
}

const EMPTY: Draft = {
  id: null,
  name: '',
  description: '',
  price: '',
  totalWeightG: '',
  sellerId: '',
  active: true,
  items: [{ productVariantId: '', quantity: '1' }],
};

/** Gift boxes (SDS §1.2, §6.1): fixed sets of variants sold at one price. */
export function BundleManager({
  client,
  canPickSeller = false,
}: {
  client: CatalogueClient;
  canPickSeller?: boolean;
}) {
  const bundles = useLoad(
    () =>
      client
        .request<BundleRow[] | Page<BundleRow>>('GET', '/api/admin/bundles?includeInactive=true')
        .then((r) => (Array.isArray(r) ? r : r.items)),
    'bundles',
  );
  const products = useLoad(
    () =>
      client
        .request<Page<CatalogueProduct>>('GET', '/api/admin/products?pageSize=100')
        .then((r) => r.items),
    'products',
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sellers = [...new Map((products.data ?? []).map((p) => [p.seller.id, p.seller])).values()];
  const variantsFor = (sellerId: string) =>
    (products.data ?? [])
      .filter((p) => !canPickSeller || !sellerId || p.seller.id === sellerId)
      .flatMap((p) =>
        p.variants
          .filter((v) => v.active)
          .map((v) => ({ id: v.id, label: `${p.name} — ${v.name} (${v.size})` })),
      );

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    const items = draft.items.filter((i) => i.productVariantId);
    if (draft.name.trim().length < 2 || draft.description.trim().length < 10) {
      return setError('Give the gift box a name and a description of at least 10 characters.');
    }
    if (!(Number(draft.price) > 0)) return setError('Price must be greater than 0.');
    if (items.length === 0) return setError('Add at least one product to the box.');
    if (!draft.id && canPickSeller && !draft.sellerId) return setError('Choose the seller.');
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Number(draft.price).toFixed(2),
      ...(draft.totalWeightG ? { totalWeightG: Number(draft.totalWeightG) } : {}),
      items: items.map((i) => ({
        productVariantId: i.productVariantId,
        quantity: Number(i.quantity) || 1,
      })),
      ...(draft.id ? { active: draft.active } : canPickSeller ? { sellerId: draft.sellerId } : {}),
    };
    setBusy(true);
    try {
      if (draft.id) await client.request('PATCH', `/api/admin/bundles/${draft.id}`, body);
      else await client.request('POST', '/api/admin/bundles', body);
      setDraft(null);
      await bundles.reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {bundles.error ? <Alert tone="error">{bundles.error}</Alert> : null}
      {!bundles.data ? (
        <Spinner label="Loading gift boxes" />
      ) : (
        <Table caption="Gift boxes">
          <TableHead>
            <tr>
              <Th>Gift box</Th>
              {canPickSeller ? <Th>Seller</Th> : null}
              <Th>Contents</Th>
              <Th align="right">Price</Th>
              <Th align="right">Boxes available</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {bundles.data.length === 0 ? (
              <EmptyRow colSpan={canPickSeller ? 7 : 6}>No gift boxes yet.</EmptyRow>
            ) : (
              bundles.data.map((b) => (
                <tr key={b.id}>
                  <Td>{b.name}</Td>
                  {canPickSeller ? <Td>{b.seller.businessName}</Td> : null}
                  <Td>
                    {b.components
                      .map((c) => `${c.quantity} × ${c.product.name} ${c.size}`)
                      .join(', ')}
                  </Td>
                  <Td align="right">
                    {lkr(b.price)}
                    <div className="text-forest-500 text-xs">
                      separately {lkr(b.componentsTotal)}
                    </div>
                  </Td>
                  <Td align="right">{b.available}</Td>
                  <Td>
                    <Badge tone={b.active ? 'success' : 'neutral'}>
                      {b.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setDraft({
                          id: b.id,
                          name: b.name,
                          description: b.description,
                          price: b.price,
                          totalWeightG: String(b.totalWeightG),
                          sellerId: b.seller.id,
                          active: b.active,
                          items: b.components.map((c) => ({
                            productVariantId: c.productVariantId,
                            quantity: String(c.quantity),
                          })),
                        })
                      }
                    >
                      Edit
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {draft ? (
        <form
          onSubmit={save}
          className="border-cream-300 space-y-3 rounded-xl border bg-white p-4"
          noValidate
        >
          <h2 className="font-semibold">{draft.id ? 'Edit gift box' : 'New gift box'}</h2>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {!draft.id && canPickSeller ? (
              <FormField label="Seller" required>
                <Select
                  value={draft.sellerId}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sellerId: e.target.value,
                      items: [{ productVariantId: '', quantity: '1' }],
                    })
                  }
                >
                  <option value="">Choose a seller…</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label="Name" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </FormField>
            <FormField label="Price (LKR)" required>
              <Input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              />
            </FormField>
            <FormField label="Packed weight (g)" hint="Leave empty to use the sum of the jars.">
              <Input
                inputMode="numeric"
                value={draft.totalWeightG}
                onChange={(e) => setDraft({ ...draft, totalWeightG: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Description" required>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </FormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Contents</legend>
            {draft.items.map((item, i) => (
              <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_6rem_auto]">
                <FormField label={`Product ${i + 1}`}>
                  <Select
                    value={item.productVariantId}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        items: draft.items.map((x, j) =>
                          j === i ? { ...x, productVariantId: e.target.value } : x,
                        ),
                      })
                    }
                  >
                    <option value="">Choose…</option>
                    {variantsFor(draft.sellerId).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Qty">
                  <Input
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        items: draft.items.map((x, j) =>
                          j === i ? { ...x, quantity: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={draft.items.length === 1}
                  onClick={() =>
                    setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  items: [...draft.items, { productVariantId: '', quantity: '1' }],
                })
              }
            >
              Add product
            </Button>
          </fieldset>
          {draft.id ? (
            <Checkbox
              label="On sale"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save gift box'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => setDraft({ ...EMPTY, items: [{ productVariantId: '', quantity: '1' }] })}
        >
          New gift box
        </Button>
      )}
    </div>
  );
}
