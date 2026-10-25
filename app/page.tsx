'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from './admin/lib/api';

/**
 * Operations dashboard (SDS §6.5). Four KPI cards on top, 14-day revenue
 * sparkline below, then the month's top-selling products. All three queries
 * are admin-only — if the cookie isn't there, an inline error surfaces.
 */

interface Kpis {
  todayRevenue: string;
  pendingOrders: number;
  activeSubscriptions: number;
  batchesExpiringSoon: number;
}

interface RevenuePoint {
  date: string;
  total: string;
}

interface TopSeller {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: string;
}

function fmtMoney(v: string): string {
  return `LKR ${Number(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Sparkline({ data }: { data: RevenuePoint[] }) {
  if (data.length === 0) return <div className="text-forest-400">No revenue yet.</div>;
  const values = data.map((p) => Number(p.total));
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 640;
  const H = 140;
  const stepX = W / Math.max(1, data.length - 1);
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`)
    .join(' ');
  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polyline points={points} fill="none" stroke="#557f41" strokeWidth={2} />
        {values.map((v, i) => (
          <circle
            key={data[i].date}
            cx={(i * stepX).toFixed(1)}
            cy={(H - ((v - min) / range) * H).toFixed(1)}
            r={3}
            fill="#557f41"
          />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-forest-400">
        <span>{shortDay(data[0].date)}</span>
        <span>{shortDay(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[] | null>(null);
  const [topSelling, setTopSelling] = useState<TopSeller[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [k, r, t] = await Promise.all([
        adminApi<Kpis>('GET', '/api/admin/analytics/dashboard'),
        adminApi<RevenuePoint[]>('GET', '/api/admin/analytics/revenue-series'),
        adminApi<TopSeller[]>('GET', '/api/admin/analytics/top-selling'),
      ]);
      setKpis(k);
      setRevenue(r);
      setTopSelling(t);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <span className="rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
          Admin Console
        </span>
        <h1 className="font-serif text-4xl text-forest-700">Operations dashboard</h1>
        <p className="text-forest-500">
          Live KPIs · 14-day revenue trend · Month-to-date top sellers. Refreshes on page load.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-danger-300 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today revenue" value={kpis ? fmtMoney(kpis.todayRevenue) : '…'} tone="brand" />
        <KpiCard label="Pending orders" value={kpis ? String(kpis.pendingOrders) : '…'} tone="clay" />
        <KpiCard
          label="Active subscriptions"
          value={kpis ? String(kpis.activeSubscriptions) : '…'}
          tone="brand"
        />
        <KpiCard
          label="Batches expiring < 7 d"
          value={kpis ? String(kpis.batchesExpiringSoon) : '…'}
          tone="amber"
        />
      </section>

      <section className="space-y-4 rounded-xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-forest-700">Revenue · last 14 days</h2>
          <Link href="/orders" className="text-sm text-brand-700 hover:text-brand-900">
            View orders →
          </Link>
        </header>
        {revenue ? <Sparkline data={revenue} /> : <p className="text-forest-400">Loading…</p>}
      </section>

      <section className="space-y-4 rounded-xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-forest-700">Top sellers · this month</h2>
          <Link href="/sellers" className="text-sm text-brand-700 hover:text-brand-900">
            All sellers →
          </Link>
        </header>
        {topSelling === null ? (
          <p className="text-forest-400">Loading…</p>
        ) : topSelling.length === 0 ? (
          <p className="text-forest-500">No sales yet this month.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-forest-500">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Units</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {topSelling.map((row) => (
                <tr key={row.productId}>
                  <td className="py-3 font-medium text-forest-700">{row.productName}</td>
                  <td className="py-3 text-right">{row.unitsSold}</td>
                  <td className="py-3 text-right font-semibold text-forest-700">
                    {fmtMoney(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashTile href="/sellers" label="Seller approvals" />
        <DashTile href="/fulfilment" label="Fulfilment queue" />
        <DashTile href="/refund-requests" label="Refund requests" />
        <DashTile href="/reviews" label="Review moderation" />
      </nav>
    </main>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'brand' | 'clay' | 'amber';
}) {
  const ring = {
    brand: 'border-brand-200 bg-brand-50',
    clay: 'border-clay-200 bg-clay-50',
    amber: 'border-amber-200 bg-amber-50',
  }[tone];
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${ring}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-forest-500">{label}</p>
      <p className="mt-2 font-serif text-3xl text-forest-700">{value}</p>
    </div>
  );
}

function DashTile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-cream-200 bg-cream-50 p-4 text-center text-sm font-medium text-forest-700 transition-shadow hover:shadow-md"
    >
      {label}
    </Link>
  );
}
