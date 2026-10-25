'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import { ConfirmDialog } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { Table, TableBody, TableHead, Td, Th } from '../components/Table';
import {
  CATEGORIES,
  type CatalogueClient,
  type CatalogueProduct,
  type CatalogueVariant,
  day,
  lkr,
  message,
  useLoad,
} from './client';

interface VariantDraft {
  sku: string;
  name: string;
  size: string;
  price: string;
  unitWeightG: string;
}

const EMPTY_VARIANT: VariantDraft = { sku: '', name: '', size: '', price: '', unitWeightG: '' };

interface ProductDraft {
  name: string;
  description: string;
  category: string;
  basePrice: string;
  unitWeightG: string;
  ingredients: string;
  allergens: string;
  sellerId: string;
}

function draftOf(p: CatalogueProduct | null): ProductDraft {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    category: p?.category ?? CATEGORIES[0],
    basePrice: p?.basePrice ?? '',
    unitWeightG: p ? String(p.unitWeightG) : '',
    ingredients: p?.ingredients ?? '',
    allergens: p?.allergens ?? '',
    sellerId: p?.seller.id ?? '',
  };
}

/** Client-side checks mirror the API's 422 rules so most mistakes are caught before sending. */
function productProblems(
  d: ProductDraft,
  needSeller: boolean,
): Partial<Record<keyof ProductDraft, string>> {
  const out: Partial<Record<keyof ProductDraft, string>> = {};
  if (d.name.trim().length < 2) out.name = 'Enter a product name.';
  if (d.description.trim().length < 10)
    out.description = 'Describe the product in at least 10 characters.';
  if (!(Number(d.basePrice) > 0)) out.basePrice = 'Price must be greater than 0.';
  if (!(Number.isInteger(Number(d.unitWeightG)) && Number(d.unitWeightG) > 0)) {
    out.unitWeightG = 'Weight must be a whole number of grams above 0.';
  }
  if (needSeller && !d.sellerId) out.sellerId = 'Choose the seller.';
  return out;
}

function variantProblem(v: VariantDraft): string | null {
  if (!v.sku.trim() || !v.name.trim() || !v.size.trim()) return 'SKU, name and size are required.';
  if (!(Number(v.price) > 0)) return 'Variant price must be greater than 0.';
  if (!(Number.isInteger(Number(v.unitWeightG)) && Number(v.unitWeightG) > 0)) {
    return 'Variant weight must be a whole number of grams above 0.';
  }
  return null;
}

const variantBody = (v: VariantDraft) => ({
  sku: v.sku.trim(),
  name: v.name.trim(),
  size: v.size.trim(),
  price: Number(v.price).toFixed(2),
  unitWeightG: Number(v.unitWeightG),
});

/**
 * Create or edit a product with its variants, images, ingredients and
 * allergens (DDP-#12, SDS §6.2). Removing a product or variant deactivates
 * it: it leaves the catalogue and carts, its history stays intact.
 */
export function ProductEditor({
  client,
  productId,
  canPickSeller = false,
  basePath,
  onCreated,
}: {
  client: CatalogueClient;
  productId?: string;
  /** Admins create products on behalf of a seller. */
  canPickSeller?: boolean;
  basePath: string;
  onCreated: (id: string) => void;
}) {
  const isNew = !productId;
  const product = useLoad<CatalogueProduct | null>(
    () =>
      productId
        ? client.request<CatalogueProduct>('GET', `/api/admin/products/${productId}`)
        : Promise.resolve(null),
    productId ?? 'new',
  );
  const sellers = useLoad<Array<{ id: string; businessName: string }>>(
    () =>
      canPickSeller
        ? client.request<Array<{ id: string; businessName: string }>>(
            'GET',
            '/api/admin/sellers?status=APPROVED',
          )
        : Promise.resolve([]),
    canPickSeller ? 'sellers' : 'none',
  );

  if (product.loading && !product.data && !isNew) return <Spinner label="Loading product" />;
  if (product.error) return <Alert tone="error">{product.error}</Alert>;

  return (
    <ProductForm
      key={product.data?.id ?? 'new'}
      client={client}
      product={product.data}
      sellers={sellers.data ?? []}
      canPickSeller={canPickSeller}
      basePath={basePath}
      onCreated={onCreated}
      onChanged={(p) => product.setData(p)}
      reload={product.reload}
    />
  );
}

function ProductForm({
  client,
  product,
  sellers,
  canPickSeller,
  basePath,
  onCreated,
  onChanged,
  reload,
}: {
  client: CatalogueClient;
  product: CatalogueProduct | null;
  sellers: Array<{ id: string; businessName: string }>;
  canPickSeller: boolean;
  basePath: string;
  onCreated: (id: string) => void;
  onChanged: (p: CatalogueProduct) => void;
  reload: () => Promise<void>;
}) {
  const isNew = product === null;
  const [draft, setDraft] = useState<ProductDraft>(draftOf(product));
  const [variants, setVariants] = useState<VariantDraft[]>([{ ...EMPTY_VARIANT }]);
  const [problems, setProblems] = useState<Partial<Record<keyof ProductDraft, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState(false);

  const set = (k: keyof ProductDraft) => (value: string) => setDraft({ ...draft, [k]: value });

  async function save(e: FormEvent) {
    e.preventDefault();
    const found = productProblems(draft, isNew && canPickSeller);
    setProblems(found);
    setError(null);
    setNotice(null);
    if (Object.keys(found).length > 0) return;
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category,
      basePrice: Number(draft.basePrice).toFixed(2),
      unitWeightG: Number(draft.unitWeightG),
      ingredients: draft.ingredients.trim() || null,
      allergens: draft.allergens.trim() || null,
    };
    setBusy(true);
    try {
      if (isNew) {
        const variantError = variants.map(variantProblem).find(Boolean);
        if (variantError) {
          setError(variantError);
          return;
        }
        const created = await client.request<CatalogueProduct>('POST', '/api/admin/products', {
          ...body,
          ...(canPickSeller ? { sellerId: draft.sellerId } : {}),
          variants: variants.map(variantBody),
        });
        onCreated(created.id);
      } else {
        const updated = await client.request<CatalogueProduct>(
          'PATCH',
          `/api/admin/products/${product.id}`,
          body,
        );
        onChanged(updated);
        setNotice('Product saved.');
      }
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function setProductActive(active: boolean) {
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      const updated = active
        ? await client.request<CatalogueProduct>('PATCH', `/api/admin/products/${product.id}`, {
            active: true,
          })
        : await client.request<CatalogueProduct>('DELETE', `/api/admin/products/${product.id}`);
      onChanged(updated);
      setConfirmProduct(false);
      setNotice(
        active
          ? 'Product is back on sale.'
          : 'Product deactivated. It no longer appears in the catalogue.',
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {product ? (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={product.active ? 'success' : 'neutral'}>
              {product.active ? 'On sale' : 'Inactive'}
            </Badge>
            <span>Seller: {product.seller.businessName}</span>
            <span>· /{product.slug}</span>
            <a className="underline" href={`${basePath}/${product.id}/batches`}>
              Manage batches
            </a>
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {isNew && canPickSeller ? (
            <FormField label="Seller" required error={problems.sellerId}>
              <Select value={draft.sellerId} onChange={(e) => set('sellerId')(e.target.value)}>
                <option value="">Choose a seller…</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.businessName}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
          <FormField label="Name" required error={problems.name}>
            <Input value={draft.name} onChange={(e) => set('name')(e.target.value)} />
          </FormField>
          <FormField label="Category" required>
            <Select value={draft.category} onChange={(e) => set('category')(e.target.value)}>
              {[...new Set([...CATEGORIES, draft.category])].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Base price (LKR)" required error={problems.basePrice}>
            <Input
              inputMode="decimal"
              value={draft.basePrice}
              onChange={(e) => set('basePrice')(e.target.value)}
            />
          </FormField>
          <FormField
            label="Unit weight (g)"
            required
            error={problems.unitWeightG}
            hint="Includes the jar; drives shipping."
          >
            <Input
              inputMode="numeric"
              value={draft.unitWeightG}
              onChange={(e) => set('unitWeightG')(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Description" required error={problems.description}>
          <Textarea
            rows={4}
            value={draft.description}
            onChange={(e) => set('description')(e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Ingredients"
            hint="Shown on the product page's Ingredients & Allergens tab."
          >
            <Textarea
              value={draft.ingredients}
              onChange={(e) => set('ingredients')(e.target.value)}
            />
          </FormField>
          <FormField label="Allergens" hint="For example: contains tree nuts. Leave empty if none.">
            <Textarea value={draft.allergens} onChange={(e) => set('allergens')(e.target.value)} />
          </FormField>
        </div>

        {isNew ? (
          <fieldset className="border-cream-300 space-y-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold">Variants</legend>
            {variants.map((v, i) => (
              <VariantFields
                key={i}
                index={i}
                value={v}
                onChange={(next) => setVariants(variants.map((x, j) => (j === i ? next : x)))}
                onRemove={
                  variants.length > 1
                    ? () => setVariants(variants.filter((_, j) => j !== i))
                    : undefined
                }
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])}
            >
              Add another variant
            </Button>
          </fieldset>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </Button>
          {product ? (
            product.active ? (
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => setConfirmProduct(true)}
              >
                Deactivate product
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void setProductActive(true)}
              >
                Put back on sale
              </Button>
            )
          ) : null}
        </div>
      </form>

      {product ? (
        <>
          <VariantsSection client={client} product={product} onChanged={reload} />
          <ImagesSection client={client} product={product} onChanged={reload} />
        </>
      ) : null}

      <ConfirmDialog
        open={confirmProduct}
        title="Deactivate this product?"
        description="It disappears from the catalogue and from carts, and active subscriptions to its variants are paused. Orders and history are kept."
        confirmLabel="Deactivate"
        tone="danger"
        busy={busy}
        error={error}
        onConfirm={() => setProductActive(false)}
        onCancel={() => setConfirmProduct(false)}
      />
    </div>
  );
}

function VariantFields({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: VariantDraft;
  onChange: (v: VariantDraft) => void;
  onRemove?: () => void;
}) {
  const field = (k: keyof VariantDraft) => (e: { target: { value: string } }) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid items-end gap-3 sm:grid-cols-6">
      <FormField label={`Variant ${index + 1} SKU`} required>
        <Input value={value.sku} onChange={field('sku')} />
      </FormField>
      <FormField label="Name" required>
        <Input value={value.name} onChange={field('name')} />
      </FormField>
      <FormField label="Size" required hint="e.g. 250 g">
        <Input value={value.size} onChange={field('size')} />
      </FormField>
      <FormField label="Price (LKR)" required>
        <Input inputMode="decimal" value={value.price} onChange={field('price')} />
      </FormField>
      <FormField label="Weight (g)" required>
        <Input inputMode="numeric" value={value.unitWeightG} onChange={field('unitWeightG')} />
      </FormField>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}

function VariantsSection({
  client,
  product,
  onChanged,
}: {
  client: CatalogueClient;
  product: CatalogueProduct;
  onChanged: () => Promise<void>;
}) {
  const [adding, setAdding] = useState<VariantDraft>({ ...EMPTY_VARIANT });
  const [editing, setEditing] = useState<{ id: string; draft: VariantDraft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const toDraft = (v: CatalogueVariant): VariantDraft => ({
    sku: v.sku,
    name: v.name,
    size: v.size,
    price: v.price,
    unitWeightG: String(v.unitWeightG),
  });

  return (
    <section aria-labelledby="variants-h" className="space-y-3">
      <h2 id="variants-h" className="text-lg font-semibold">
        Variants
      </h2>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Table caption="Variants" captionHidden>
        <TableHead>
          <tr>
            <Th>SKU</Th>
            <Th>Variant</Th>
            <Th align="right">Price</Th>
            <Th align="right">Weight</Th>
            <Th align="right">In stock</Th>
            <Th>Earliest expiry</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {product.variants.map((v) =>
            editing?.id === v.id ? (
              <tr key={v.id}>
                <Td colSpan={8}>
                  <VariantFields
                    index={0}
                    value={editing.draft}
                    onChange={(draft) => setEditing({ id: v.id, draft })}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        const problem = variantProblem(editing.draft);
                        if (problem) return setError(problem);
                        void run(() =>
                          client.request(
                            'PATCH',
                            `/api/admin/products/${product.id}/variants/${v.id}`,
                            variantBody(editing.draft),
                          ),
                        ).then((ok) => ok && setEditing(null));
                      }}
                    >
                      Save variant
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </Td>
              </tr>
            ) : (
              <tr key={v.id}>
                <Td className="font-mono text-xs">{v.sku}</Td>
                <Td>
                  {v.name} ({v.size})
                </Td>
                <Td align="right">{lkr(v.price)}</Td>
                <Td align="right">{v.unitWeightG} g</Td>
                <Td align="right">{v.available}</Td>
                <Td>{day(v.earliestExpiry)}</Td>
                <Td>
                  <Badge tone={v.active ? 'success' : 'neutral'}>
                    {v.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ id: v.id, draft: toDraft(v) })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={v.active ? 'danger' : 'secondary'}
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          v.active
                            ? client.request(
                                'DELETE',
                                `/api/admin/products/${product.id}/variants/${v.id}`,
                              )
                            : client.request(
                                'PATCH',
                                `/api/admin/products/${product.id}/variants/${v.id}`,
                                { active: true },
                              ),
                        )
                      }
                    >
                      {v.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ),
          )}
        </TableBody>
      </Table>
      <form
        className="border-cream-300 space-y-2 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const problem = variantProblem(adding);
          if (problem) return setError(problem);
          void run(() =>
            client.request(
              'POST',
              `/api/admin/products/${product.id}/variants`,
              variantBody(adding),
            ),
          ).then((ok) => ok && setAdding({ ...EMPTY_VARIANT }));
        }}
        noValidate
      >
        <h3 className="text-sm font-semibold">Add a variant</h3>
        <VariantFields index={product.variants.length} value={adding} onChange={setAdding} />
        <Button type="submit" size="sm" disabled={busy}>
          Add variant
        </Button>
      </form>
    </section>
  );
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ImagesSection({
  client,
  product,
  onChanged,
}: {
  client: CatalogueClient;
  product: CatalogueProduct;
  onChanged: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose an image to upload.');
    if (!IMAGE_TYPES.includes(file.type)) return setError('Use a JPEG, PNG, WebP or HEIC image.');
    if (file.size > MAX_IMAGE_BYTES) return setError('Images must be 5 MB or smaller.');
    if (!altText.trim()) return setError('Describe the image for screen-reader users.');
    setBusy(true);
    setError(null);
    try {
      await client.uploadProductImage(product.id, file, altText.trim());
      setFile(null);
      setAltText('');
      await onChanged();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(imageId: string) {
    setBusy(true);
    setError(null);
    try {
      await client.request('DELETE', `/api/admin/products/${product.id}/images/${imageId}`);
      await onChanged();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="images-h" className="space-y-3">
      <h2 id="images-h" className="text-lg font-semibold">
        Images
      </h2>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {product.images.length === 0 ? (
        <p className="text-forest-500 text-sm">No images yet.</p>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {product.images.map((img) => (
          <li key={img.id} className="space-y-1">
            <img
              src={img.url}
              alt={img.altText}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove(img.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={upload}
        className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        noValidate
      >
        <FormField label="Image file" hint="JPEG, PNG, WebP or HEIC, up to 5 MB.">
          <Input
            type="file"
            accept={IMAGE_TYPES.join(',')}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </FormField>
        <FormField label="Alt text" required>
          <Input value={altText} onChange={(e) => setAltText(e.target.value)} />
        </FormField>
        <Button type="submit" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </form>
    </section>
  );
}
