'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/button';
import { api } from '../../lib/api';



const FREQUENCY_LABEL: Record<number, string> = {
    14: 'Every 2 weeks',
    30: 'Every month',
    60: 'Every 2 months',
};

interface SubscriptionRow {
    id: string;
    productVariantId: string;
    frequencyDays: number;
    discountRate: string;
    quantity: number;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    nextBillingDate: string;
    paymentGateway: 'STRIPE' | 'PAYHERE';
    cancelledAt: string | null;
}

const STATUS_BADGE: Record<SubscriptionRow['status'], string> = {
    ACTIVE: 'bg-brand-100 text-brand-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-cream-200 text-forest-500',
};

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function SubscriptionsPage() {
    const [rows, setRows] = useState<SubscriptionRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            setRows(await api<SubscriptionRow[]>('GET', '/api/subscriptions'));
        } catch (e) {
            setError((e as Error).message);
            setRows([]);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function act(
        id: string,
        action: 'pause' | 'resume' | 'skip-next' | 'cancel',
    ): Promise<void> {
        if (action === 'cancel') {
            if (!confirm('Cancel this subscription? This cannot be undone.')) return;
        }
        setBusyId(id);
        try {
            await api('PATCH', `/api/subscriptions/${id}/${action}`);
            await load();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
            <header className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Subscribe &amp; Save
                </span>
                <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">My subscriptions</h1>
                <p className="text-lg leading-relaxed text-forest-500">
                    We bill these automatically each cycle at 06:00 — pause anytime, skip the next
                    one, or cancel if you&rsquo;d like to take a break.
                </p>
            </header>

            {error && (
                <div className="rounded-2xl border border-danger-300 bg-danger-50 p-4 text-sm text-danger-700">
                    {error}
                </div>
            )}

            {rows === null ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-cream-50 p-5"
                        >
                            <div className="space-y-2">
                                <div className="skeleton h-5 w-48" />
                                <div className="skeleton h-3 w-64" />
                            </div>
                            <div className="flex gap-2">
                                <div className="skeleton h-9 w-20 rounded-full" />
                                <div className="skeleton h-9 w-20 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-cream-300 bg-cream-100/50 px-6 py-20 text-center">
                    <span aria-hidden="true" className="text-4xl">
                        🔁
                    </span>
                    <p className="max-w-md text-lg text-forest-500">
                        You don&rsquo;t have any subscriptions yet. Toggle the Subscribe &amp; Save
                        switch on any product page to start one.
                    </p>
                    <Button>
                        <a href="/products">Browse products</a>
                    </Button>
                </div>
            ) : (
                <ul className="divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 shadow-sm">
                    {rows.map((s) => {
                        const isTerminal = s.status === 'CANCELLED';
                        const discountPct = Math.round(Number(s.discountRate) * 100);
                        return (
                            <li
                                key={s.id}
                                className={`flex flex-col gap-3 p-5 transition-opacity duration-200 md:flex-row md:items-center md:justify-between ${busyId === s.id ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGE[s.status]}`}
                                        >
                                            {s.status}
                                        </span>
                                        <span className="text-sm text-forest-500">
                                            {FREQUENCY_LABEL[s.frequencyDays] ?? `Every ${s.frequencyDays} days`} ·{' '}
                                            Qty {s.quantity} · {discountPct}% off
                                        </span>
                                    </div>
                                    <p className="text-sm text-forest-500">
                                        Variant <code className="font-mono">{s.productVariantId.slice(0, 8)}…</code>
                                        {' · '}
                                        {isTerminal && s.cancelledAt
                                            ? `Cancelled ${fmtDate(s.cancelledAt)}`
                                            : `Next charge ${fmtDate(s.nextBillingDate)}`}
                                    </p>
                                    <p className="text-xs text-forest-400">
                                        Payment via {s.paymentGateway === 'STRIPE' ? 'Card (Stripe)' : 'PayHere'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {s.status === 'ACTIVE' && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={() => act(s.id, 'pause')}
                                                disabled={busyId === s.id}
                                            >
                                                Pause
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => act(s.id, 'skip-next')}
                                                disabled={busyId === s.id}
                                            >
                                                Skip next
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => act(s.id, 'cancel')}
                                                disabled={busyId === s.id}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                    {s.status === 'PAUSED' && (
                                        <>
                                            <Button onClick={() => act(s.id, 'resume')} disabled={busyId === s.id}>
                                                Resume
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => act(s.id, 'cancel')}
                                                disabled={busyId === s.id}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
