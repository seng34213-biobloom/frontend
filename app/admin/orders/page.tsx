'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Alert,
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
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, qs, type Paginated } from '../../lib/admin/api';
import { fmtDateTime, fmtMoney, fmtOrderNumber } from '../../lib/admin/format';
import { useResource } from '../../lib/admin/use-resource';

const STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];
const PAGE_SIZE = 25;

interface OrderRow {
  id: string;
  orderNumber: number;
  placedAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  itemCount: number;
  customer: { name: string; email: string };
  deliveryStatus: string | null;
}

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const orders = useResource(
    () =>
      adminApi<Paginated<OrderRow>>(
        'GET',
        `/api/admin/orders${qs({ status, search: query, page, pageSize: PAGE_SIZE })}`,
      ),
    [status, query, page],
  );

  return (
    <>
      <PageHeader title="Orders" description="Every order across the marketplace, newest first." />
      <form
        className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <FormField label="Search" hint="Order number (BB-000123), customer name or email">
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </FormField>
      </form>

      {orders.error ? <Alert tone="error">{orders.error}</Alert> : null}
      {orders.loading && !orders.data ? <Spinner label="Loading orders" /> : null}
      {orders.data ? (
        <>
          <Table caption="Orders">
            <TableHead>
              <tr>
                <Th>Order</Th>
                <Th>Placed</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Delivery</Th>
                <Th align="right">Items</Th>
                <Th align="right">Total</Th>
              </tr>
            </TableHead>
            <TableBody>
              {orders.data.items.length === 0 ? (
                <EmptyRow colSpan={7}>No orders match these filters.</EmptyRow>
              ) : (
                orders.data.items.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link className="font-semibold underline" href={`/orders/${o.id}`}>
                        {fmtOrderNumber(o.orderNumber, o.id)}
                      </Link>
                    </Td>
                    <Td>{fmtDateTime(o.placedAt)}</Td>
                    <Td>
                      <div>{o.customer.name}</div>
                      <div className="text-forest-500 text-xs">{o.customer.email}</div>
                    </Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td>{o.deliveryStatus ? <StatusBadge status={o.deliveryStatus} /> : '—'}</Td>
                    <Td align="right">{o.itemCount}</Td>
                    <Td align="right">{fmtMoney(o.totalAmount)}</Td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={orders.data.page}
            pageSize={orders.data.pageSize}
            total={orders.data.total}
            onPage={setPage}
            label="Orders pages"
          />
        </>
      ) : null}
    </>
  );
}
