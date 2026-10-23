'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '../../components/button';
import { ApiError, api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface Variant {
    id: string;
    sku: string;
    name: string;
    size: string;
    price: string;
    unitWeightG: number;
}

interface Props {
    productSlug: string;
    variants: Variant[];
    stockByVariant: Record<string, number>;
    earliestExpiryByVariant: Record<string, string | null>;
}

function stockBadge(stock: number) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-100 px-3 py-1 text-xs font-semibold text-danger-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                Out of stock
            </span>
        );
    }
    if (stock < 10) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Only {stock} left
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            In stock
        </span>
    );
}

function fmtExpiry(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function VariantPanel({
    productSlug,
    variants,
    stockByVariant,
    earliestExpiryByVariant,
}: Props) {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? '');
    const [qty, setQty] = useState(1);
    const [subscribe, setSubscribe] = useState(false);
    const [frequencyDays, setFrequencyDays] = useState(30);
    const [busy, setBusy] = useState<null | 'add' | 'buy' | 'subscribe'>(null);
    const [feedback, setFeedback] = useState<
        | { kind: 'ok'; message: string }
        | { kind: 'error'; message: string }
        | null
    >(null);

    const selected = useMemo(
        () => variants.find((v) => v.id === selectedId) ?? variants[0],
        [variants, selectedId],
    );
    if (!selected) return null;
    const stock = stockByVariant[selected.id] ?? 0;
    const earliestExpiry = earliestExpiryByVariant[selected.id] ?? null;
    const lineTotal = (Number(selected.price) * qty).toFixed(2);
    const subscriptionLineTotal = (Number(lineTotal) * 0.9).toFixed(2);

    function gotoLogin(intent: 'cart' | 'checkout' | 'subscribe') {
        const next =
            intent === 'subscribe'
                ? `/products/${productSlug}`
                : intent === 'checkout'
                    ? '/checkout'
                    : `/products/${productSlug}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
    }

    async function addToCart(): Promise<boolean> {
        try {
            await api('POST', '/api/cart/items', {
                productVariantId: selected.id,
                quantity: qty,
            });
            return true;
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                gotoLogin('cart');
                return false;
            }
            setFeedback({ kind: 'error', message: (e as Error).message });
            return false;
        }
    }

    async function onAdd() {
        if (!user) {
            gotoLogin('cart');
            return;
        }
        setBusy('add');
        setFeedback(null);
        const ok = await addToCart();
        setBusy(null);
        if (ok) {
            setFeedback({
                kind: 'ok',
                message: `${qty} × ${selected.size} added to cart.`,
            });
            router.refresh();
        }
    }

    async function onBuyNow() {
        if (!user) {
            gotoLogin('checkout');
            return;
        }
        setBusy('buy');
        setFeedback(null);
        const ok = await addToCart();
        setBusy(null);
        if (ok) router.push('/checkout');
    }

    function onSubscribe() {
        if (!user) {
            gotoLogin('subscribe');
            return;
        }
        const qs = new URLSearchParams({
            subscribe: '1',
            slug: productSlug,
            variantId: selected.id,
            frequency: String(frequencyDays),
            quantity: String(qty),
        });
        router.push(`/checkout?${qs.toString()}`);
    }

    return (
        <section className="space-y-7 rounded-3xl border border-cream-200 bg-cream-50 p-6 shadow-md md:p-7">
            <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-400">
                    Pick a size
                </h2>
                <div className="flex flex-wrap gap-2.5">
                    {variants.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedId(v.id)}
                            aria-pressed={v.id === selected.id}
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-soft active:scale-[0.98] ${v.id === selected.id
                                    ? 'border-brand-600 bg-brand-600 text-cream-50 shadow-sm'
                                    : 'border-cream-300 bg-cream-50 text-forest-600 hover:border-brand-400 hover:bg-cream-100'
                                }`}
                        >
                            {v.size} — LKR {Number(v.price).toFixed(2)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {stockBadge(stock)}
                <span className="text-xs text-forest-500">
                    Earliest expiry: <strong className="font-semibold text-forest-700">{fmtExpiry(earliestExpiry)}</strong> (FIFO — oldest stock ships first)
                </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-y border-cream-200 py-5">
                <label className="block">
                    <span className="text-xs font-medium uppercase tracking-widest text-forest-400">
                        Quantity
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={Math.max(1, stock)}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
                        className="mt-1.5 block w-24 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                        disabled={stock === 0}
                    />
                </label>

                <div className="space-y-1 text-right">
                    <span className="text-xs font-medium uppercase tracking-widest text-forest-400">
                        Subtotal
                    </span>
                    <p className="text-3xl font-bold tracking-tight text-forest-700">
                        LKR {subscribe ? subscriptionLineTotal : lineTotal}
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
                <input
                    id="subscribe-toggle"
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-brand-400 text-brand-600 focus:ring-brand-500"
                />
                <div className="space-y-1">
                    <label htmlFor="subscribe-toggle" className="flex cursor-pointer items-center gap-2 font-semibold text-forest-700">
                        Subscribe &amp; Save 10%
                        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-cream-50">
                            -10%
                        </span>
                    </label>
                    <div className="text-sm text-forest-500">
                        Get a fresh jar every{' '}
                        <label htmlFor="frequency-select" className="sr-only">
                            Frequency
                        </label>
                        <select
                            id="frequency-select"
                            value={frequencyDays}
                            onChange={(e) => setFrequencyDays(Number(e.target.value))}
                            className="rounded-lg border border-cream-300 bg-cream-50 px-1.5 py-0.5 text-sm text-forest-700"
                            disabled={!subscribe}
                        >
                            <option value={14}>2 weeks</option>
                            <option value={30}>month</option>
                            <option value={60}>2 months</option>
                        </select>
                        . Pause or cancel anytime.
                    </div>
                </div>
            </div>

            {feedback && (
                <p
                    role={feedback.kind === 'error' ? 'alert' : 'status'}
                    className={`animate-pop-in rounded-2xl border p-3.5 text-sm font-medium ${feedback.kind === 'ok'
                            ? 'border-brand-300 bg-brand-50 text-brand-800'
                            : 'border-danger-500 bg-danger-100 text-danger-700'
                        }`}
                >
                    {feedback.kind === 'ok' ? '✓ ' : ''}
                    {feedback.message}
                </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
                {subscribe ? (
                    <Button
                        type="button"
                        onClick={onSubscribe}
                        disabled={stock === 0 || busy !== null}
                        className="flex-1 py-3 text-base"
                    >
                        {busy === 'subscribe' ? 'Starting…' : 'Start subscription'}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={onAdd}
                        disabled={stock === 0 || busy !== null}
                        className="flex-1 py-3 text-base"
                    >
                        {busy === 'add' ? 'Adding…' : stock === 0 ? 'Out of stock' : 'Add to cart'}
                    </Button>
                )}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onBuyNow}
                    disabled={stock === 0 || busy !== null || subscribe}
                    className="flex-1 py-3 text-base"
                >
                    {busy === 'buy' ? 'One moment…' : 'Buy now'}
                </Button>
            </div>

            <p className="text-xs text-forest-400">
                SKU {selected.sku} · {selected.unitWeightG} g per unit
            </p>
        </section>
    );
}
