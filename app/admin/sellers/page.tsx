'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/button';

/**
 * Admin pending-sellers queue. Reads from /api/admin/sellers/pending and
 * surfaces approve / reject actions per row. The page assumes the admin
 * already holds an auth_token cookie set by /api/auth/login; for the
 * Phase 3 milestone, the operator authenticates via curl/Postman and
 * this page renders against the live API.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

interface PendingSeller {
  id: string;
  email: string;
  businessName: string;
  contactName: string;
  phone: string;
  taxId: string | null;
  createdAt: string;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<string> {
  const existing = readCookie('csrf-token');
  if (existing) return existing;
  await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' });
  return readCookie('csrf-token') ?? '';
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<PendingSeller[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/sellers/pending`, {
        credentials: 'include',
      });
      if (res.status === 401) throw new Error('Sign in as an admin first');
      if (res.status === 403) throw new Error('Admin role required');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const body = (await res.json()) as PendingSeller[];
      setSellers(body);
    } catch (e) {
      setError((e as Error).message);
      setSellers([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function approve(id: string): Promise<void> {
    const csrf = await ensureCsrf();
    const res = await fetch(`${API_BASE}/api/admin/sellers/${id}/approve`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrf },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body?.message ?? `Approval failed (${res.status})`);
      return;
    }
    await refresh();
  }

  async function reject(id: string): Promise<void> {
    const reason = window.prompt('Reason for rejecting this application?')?.trim();
    if (!reason) return;
    const csrf = await ensureCsrf();
    const res = await fetch(`${API_BASE}/api/admin/sellers/${id}/reject`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body?.message ?? `Rejection failed (${res.status})`);
      return;
    }
    await refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-1">
        <span className="rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
          Admin · Seller applications
        </span>
        <h1 className="font-serif text-3xl text-forest-700">Pending sellers</h1>
        <p className="text-forest-500">
          Applications in PENDING status. Approving issues a SELLER-role JWT on next
          login; rejecting locks the email.
        </p>
      </header>

      {error && (
        <p className="rounded bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>
      )}

      {sellers === null ? (
        <p className="text-forest-500">Loading…</p>
      ) : sellers.length === 0 ? (
        <p className="text-forest-500">No pending applications.</p>
      ) : (
        <ul className="space-y-3">
          {sellers.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-cream-200 bg-cream-50 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-0.5">
                <p className="font-medium text-forest-700">{s.businessName}</p>
                <p className="text-sm text-forest-500">
                  {s.contactName} · {s.email} · {s.phone}
                </p>
                <p className="text-xs text-forest-400">
                  Applied {new Date(s.createdAt).toLocaleString()}
                  {s.taxId ? ` · Tax ID ${s.taxId}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => approve(s.id)}>Approve</Button>
                <Button variant="secondary" onClick={() => reject(s.id)}>
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
