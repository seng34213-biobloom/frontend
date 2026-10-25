'use client';

import { useState } from 'react';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { LinkButton } from '../components/LinkButton';
import { Checkbox, FormField, Input } from '../components/FormField';
import { Spinner } from '../components/Spinner';
import { EmptyRow, Table, TableBody, TableHead, Td, Th } from '../components/Table';
import { type CatalogueClient, type CatalogueProduct, type Page, lkr, useLoad } from './client';

const PAGE_SIZE = 20;

/** Product index for the admin console and the seller portal (DDP-#12, #31). */
export function ProductList({
  client,
  basePath,
  showSeller = false,
}: {
  client: CatalogueClient;
  /** e.g. "/products": rows link to `${basePath}/<id>`, the create button to `${basePath}/new`. */
  basePath: string;
  showSeller?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (query) params.set('search', query);
  if (includeInactive) params.set('includeInactive', 'true');
  const list = useLoad(
    () => client.request<Page<CatalogueProduct>>('GET', `/api/admin/products?${params.toString()}`),
    params.toString(),
  );
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
        >
          <FormField label="Search products">
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </FormField>
          <Checkbox
            label="Show inactive"
            checked={includeInactive}
            onChange={(e) => {
              setPage(1);
              setIncludeInactive(e.target.checked);
            }}
          />
        </form>
        <LinkButton href={`${basePath}/new`}>Add product</LinkButton>
      </div>
      {list.error ? <Alert tone="error">{list.error}</Alert> : null}
      {list.loading && !list.data ? <Spinner label="Loading products" /> : null}
      {list.data ? (
        <Table caption="Products">
          <TableHead>
            <tr>
              <Th>Product</Th>
              {showSeller ? <Th>Seller</Th> : null}
              <Th>Category</Th>
              <Th>Variants</Th>
              <Th align="right">In stock</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {list.data.items.length === 0 ? (
              <EmptyRow colSpan={showSeller ? 7 : 6}>No products yet.</EmptyRow>
            ) : (
              list.data.items.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <a href={`${basePath}/${p.id}`} className="font-semibold underline">
                      {p.name}
                    </a>
                    <div className="text-forest-500 text-xs">from {lkr(p.basePrice)}</div>
                  </Td>
                  {showSeller ? <Td>{p.seller?.businessName}</Td> : null}
                  <Td>{p.category}</Td>
                  <Td>{p.variants.map((v) => v.size).join(', ')}</Td>
                  <Td align="right">
                    {p.variants.reduce((acc, v) => acc + (v.available ?? 0), 0)}
                  </Td>
                  <Td>
                    <Badge tone={p.active ? 'success' : 'neutral'}>
                      {p.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <a href={`${basePath}/${p.id}/batches`} className="underline">
                      Batches
                    </a>
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}
      {list.data && pages > 1 ? (
        <nav aria-label="Product pages" className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
