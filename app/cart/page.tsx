'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../components/button';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

/**
 * Cart review screen (SDS §6.3 step 1). Lists cart lines with qty controls
 * and a "Proceed to checkout" CTA. The Phase 5 e2e covers the API surface;
 * this view is the customer-facing twin.
 */

// Opt out of static generation — cart is user-specific and depends on
// client-side auth/session context that is unavailable at build time.
export const dynamic = 'force-dynamic';

interface CartLine {
    id: string;
    quantity: number;
    variant: {
        id: string;
        sku: string;
        name: string;
        size: string;
        price: string;
        unitWeightG: number;
        productSlug: string;
        productName: string;
    };
    available: number;
    lineSubtotal: string;
}

interface CartView {
    items: CartLine[];
    itemCount: number;
    subtotal: string;
    totalWeightG: number;
}

export default function CartPage() {
    const t = useTranslations('cart');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [cart, setCart] = useState<CartView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyItemId, setBusyItemId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            setCart(await api<CartView>('GET', '/api/cart'));
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                router.push('/login?next=/cart');
                return;
            }
            setError((e as Error).message);
            setCart({ items: [], itemCount: 0, subtotal: '0.00', totalWeightG: 0 });
        }
    }, [router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?next=/cart');
            return;
        }
        void load();
    }, [authLoading, user, load, router]);

    async function changeQty(itemId: string, qty: number) {
        setBusyItemId(itemId);
        try {
            const next = await api<CartView>('PATCH', `/api/cart/items/${itemId}`, { quantity: qty });
            setCart(next);
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setBusyItemId(null);
        }
    }

    async function removeItem(itemId: string) {
        setBusyItemId(itemId);
        try {
            const next = await api<CartView>('DELETE', `/api/cart/items/${itemId}`);
            setCart(next);
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setBusyItemId(null);
        }
    }

    return (
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
            <header className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {t('stepIndicator')}
                </span>
                <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">{t('heading')}</h1>
            </header>

            {error && (
                <div className="rounded-2xl border border-danger-300 bg-danger-50 p-4 text-sm text-danger-700">
                    {error}
                </div>
            )}

            {cart === null ? (
                <div className="space-y-4" aria-busy="true" aria-label={tCommon('loading')}>
                    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-cream-50">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between gap-4 border-b border-cream-200 p-5 last:border-b-0"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="skeleton h-16 w-16 rounded-2xl" />
                                    <div className="space-y-2">
                                        <div className="skeleton h-5 w-40" />
                                        <div className="skeleton h-3 w-28" />
                                    </div>
                                </div>
                                <div className="skeleton h-9 w-20 rounded-xl" />
                            </div>
                        ))}
                    </div>
                    <div className="skeleton h-32 rounded-2xl" />
                </div>
            ) : cart.items.length === 0 ? (
                <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-cream-300 bg-cream-100/50 px-6 py-20 text-center">
                    <span aria-hidden="true" className="text-4xl">
                        🧺
                    </span>
                    <p className="text-lg text-forest-500">{t('empty')}</p>
                    <Button>
                        <Link href="/products">{t('browse')}</Link>
                    </Button>
                </div>
            ) : (
                <>
                    <ul className="divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 shadow-sm">
                        {cart.items.map((line) => (
                            <li
                                key={line.id}
                                className={`flex flex-col gap-4 p-5 transition-opacity duration-200 md:flex-row md:items-center md:justify-between ${busyItemId === line.id ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Artisan-label thumbnail (no photo field in the data model). */}
                                    <div
                                        aria-hidden="true"
                                        className="label-panel flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cream-200"
                                    >
                                        <span className="font-serif text-2xl tracking-tightest text-forest-700/25">
                                            {line.variant.productName.trim().charAt(0)}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <Link
                                            href={`/products/${line.variant.productSlug}`}
                                            className="font-serif text-xl text-forest-700 transition-colors hover:text-brand-700"
                                        >
                                            {line.variant.productName}
                                        </Link>
                                        <p className="text-sm text-forest-500">
                                            {line.variant.size} · {tCommon('currency')} {line.variant.price} ·{' '}
                                            {t('perUnit', { weight: line.variant.unitWeightG })}
                                        </p>
                                        <p className="text-xs text-forest-400">
                                            {line.available < 10
                                                ? t('onlyNLeft', { n: line.available })
                                                : t('inStock')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <span className="sr-only">{t('quantity')}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={line.available}
                                            value={line.quantity}
                                            disabled={busyItemId === line.id}
                                            onChange={(e) =>
                                                changeQty(line.id, Math.max(0, Number(e.target.value) || 0))
                                            }
                                            className="w-20 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                        />
                                    </label>
                                    <span className="w-28 text-right font-bold text-forest-700">
                                        {tCommon('currency')} {line.lineSubtotal}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(line.id)}
                                        disabled={busyItemId === line.id}
                                        className="rounded-full p-2 text-sm font-medium text-forest-400 transition-colors hover:bg-danger-50 hover:text-danger-700"
                                        aria-label={t('remove')}
                                    >
                                        {t('remove')}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <section className="space-y-3 rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-forest-500">{t('items')}</span>
                            <span className="font-semibold text-forest-700">{cart.itemCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-forest-500">{t('totalWeight')}</span>
                            <span className="font-semibold text-forest-700">{cart.totalWeightG} g</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-cream-200 pt-3 text-lg">
                            <span className="font-medium text-forest-600">{t('subtotal')}</span>
                            <span className="text-2xl font-bold tracking-tight text-forest-700">
                                {tCommon('currency')} {cart.subtotal}
                            </span>
                        </div>
                        <p className="pt-1 text-xs text-forest-400">{t('shippingNote')}</p>
                    </section>

                    <div className="flex justify-end">
                        <Button className="px-6 py-3 text-base">
                            <Link href="/checkout">{t('continueCheckout')}</Link>
                        </Button>
                    </div>
                </>
            )}
        </section>
    );
}
