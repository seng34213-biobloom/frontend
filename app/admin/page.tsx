'use client';

import Link from 'next/link';
import { Alert, EmptyRow, Spinner, Table, TableBody, TableHead, Td, Th } from '@biobloom/ui';
import { FulfilmentQueue } from '../components/admin/FulfilmentQueue';
import { KpiCard } from '../components/admin/KpiCard';
import { PageHeader } from '../components/admin/PageHeader';
import { RevenueChart, type RevenuePoint } from '../components/admin/RevenueChart';
import { adminApi } from '../lib/admin/api';
import { useAuth } from '../lib/admin/auth-context';
import { fmtMoney } from '../lib/admin/format';
import { useResource } from '../lib/admin/use-resource';

/**
 * Operations dashboard (SDS §6.5). Admins get four KPI cards, the 30-day
 * revenue trend and the month's top sellers. Fulfilment staff cannot read
 * the analytics endpoints, so they get the fulfilment queue instead of an
 * error (DDP-#30, DDP-#31).
 */

const REVENUE_DAYS = 30;

interface Kpis {
  todayRevenue: string;
  pendingOrders: number;
  activeSubscriptions: number;
  batchesExpiringSoon: number;
}

interface TopSeller {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: string;
}

function AdminDashboard() {
  const kpis = useResource(() => adminApi<Kpis>('GET', '/api/admin/analytics/dashboard'), []);
  const revenue = useResource(
    () =>
      adminApi<RevenuePoint[]>('GET', `/api/admin/analytics/revenue-series?days=${REVENUE_DAYS}`),
    [],
  );
  const top = useResource(
    () => adminApi<TopSeller[]>('GET', '/api/admin/analytics/top-selling'),
    [],
  );

  const k = kpis.data;
  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Operations dashboard"
        description={`Live KPIs, ${REVENUE_DAYS}-day revenue trend and this month's top sellers. Revenue counts paid orders only.`}
      />

      <section aria-labelledby="kpi-heading" className="space-y-3">
        <h2 id="kpi-heading" className="sr-only">
          Key figures
        </h2>
        {kpis.error ? <Alert tone="error">{kpis.error}</Alert> : null}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Today's revenue"
            value={k ? fmtMoney(k.todayRevenue) : null}
            tone="brand"
          />
          <KpiCard
            label="Pending orders"
            value={k ? String(k.pendingOrders) : null}
            hint="Paid or packing"
            tone="clay"
          />
          <KpiCard
            label="Active subscriptions"
            value={k ? String(k.activeSubscriptions) : null}
            tone="brand"
          />
          <KpiCard
            label="Batches expiring < 7 days"
            value={k ? String(k.batchesExpiringSoon) : null}
            hint="Food-safety watch list"
            tone="amber"
          />
        </dl>
      </section>

      <section
        aria-labelledby="revenue-heading"
        className="border-cream-300 space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="revenue-heading" className="text-forest-700 font-serif text-2xl">
            Revenue, last {REVENUE_DAYS} days
          </h2>
          <Link href="/orders" className="text-brand-700 text-sm font-medium underline">
            View orders
          </Link>
        </div>
        {revenue.error ? <Alert tone="error">{revenue.error}</Alert> : null}
        {revenue.data ? (
          <RevenueChart data={revenue.data} days={REVENUE_DAYS} />
        ) : revenue.loading ? (
          <Spinner label="Loading revenue…" />
        ) : null}
      </section>

      <section
        aria-labelledby="top-heading"
        className="border-cream-300 space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="top-heading" className="text-forest-700 font-serif text-2xl">
            Top sellers this month
          </h2>
          <Link href="/products" className="text-brand-700 text-sm font-medium underline">
            Manage products
          </Link>
        </div>
        {top.error ? <Alert tone="error">{top.error}</Alert> : null}
        <Table caption="Top-selling products this month">
          <TableHead>
            <tr>
              <Th>Product</Th>
              <Th align="right">Units sold</Th>
              <Th align="right">Revenue</Th>
            </tr>
          </TableHead>
          <TableBody>
            {top.data === null ? (
              <EmptyRow colSpan={3}>{top.loading ? <Spinner /> : 'Unavailable.'}</EmptyRow>
            ) : top.data.length === 0 ? (
              <EmptyRow colSpan={3}>No sales yet this month.</EmptyRow>
            ) : (
              top.data.map((row) => (
                <tr key={row.productId}>
                  <Td className="font-medium">
                    <Link href={`/products/${row.productId}`} className="text-brand-700 underline">
                      {row.productName}
                    </Link>
                  </Td>
                  <Td align="right">{row.unitsSold}</Td>
                  <Td align="right" className="font-semibold">
                    {fmtMoney(row.revenue)}
                  </Td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function StaffDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Today's fulfilment queue"
        description="Pack and ship paid orders oldest first, then assign each shipped order to a rider."
      />
      <FulfilmentQueue />
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <StaffDashboard />;
}
