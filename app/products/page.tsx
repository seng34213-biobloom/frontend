import Link from 'next/link';

/**
 * Customer-facing product grid (SDS §5.2 + §6.2). Server component so the
 * catalogue is SSR-rendered for SEO. The API call hits the same `/api/products`
 * endpoint Phase 4 exposes; the Next dev server can reach localhost:4000 even
 * though the browser-side calls go through NEXT_PUBLIC_API_BASE_URL.
 */

const API_INTERNAL =
    process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:4000';

interface ProductListItem {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    basePrice: string;
    unitWeightG: number;
    seller: { id: string; businessName: string };
    variants: Array<{
        id: string;
        sku: string;
        name: string;
        size: string;
        price: string;
        unitWeightG: number;
    }>;
}

async function fetchProducts(
    searchParams: Record<string, string | undefined>,
): Promise<{ items: ProductListItem[]; total: number; error?: string }> {
    const params = new URLSearchParams();
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.page) params.set('page', searchParams.page);
    const url = `${API_INTERNAL}/api/products${params.toString() ? `?${params}` : ''}`;
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { items: [], total: 0, error: `API ${res.status}` };
        return (await res.json()) as { items: ProductListItem[]; total: number };
    } catch (e) {
        return { items: [], total: 0, error: (e as Error).message };
    }
}

function lowestPrice(items: ProductListItem['variants']): string {
    if (items.length === 0) return '—';
    return items
        .map((v) => Number(v.price))
        .sort((a, b) => a - b)[0]
        .toFixed(2);
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const resolved = await searchParams;
    const { items, total, error } = await fetchProducts(resolved);

    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-14">
            <header className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Shop
                </span>
                <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">
                    Handcrafted, small batch.
                </h1>
                <p className="text-lg leading-relaxed text-forest-500">
                    Every jar carries its own batch number and expiry date — we sell the
                    earliest-expiring stock first (FIFO) so what arrives at your door has
                    the longest shelf life possible.
                </p>
            </header>

            {error && (
                <div className="rounded-2xl border border-danger-300 bg-danger-50 p-5 text-sm text-danger-700">
                    Couldn&rsquo;t load products: {error}
                </div>
            )}

            {!error && items.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-cream-300 bg-cream-100/50 px-6 py-20 text-center">
                    <span aria-hidden="true" className="text-4xl">
                        🌿
                    </span>
                    <p className="text-lg text-forest-500">
                        No products in stock right now. Check back soon.
                    </p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p, i) => (
                        <li
                            key={p.id}
                            className="group animate-fade-up [animation-fill-mode:both]"
                            style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                        >
                            <Link
                                href={`/products/${p.slug}`}
                                className="flex h-full flex-col overflow-hidden rounded-3xl border border-cream-200 bg-cream-50 shadow-sm transition-all duration-300 ease-soft hover:-translate-y-1 hover:border-cream-300 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg"
                            >
                                {/* Artisan-label image stand-in (no photo field in the data model). */}
                                <div className="label-panel relative flex aspect-[5/4] items-center justify-center overflow-hidden">
                                    <span
                                        aria-hidden="true"
                                        className="font-serif text-[5.5rem] leading-none tracking-tightest text-forest-700/10 transition-transform duration-500 ease-soft group-hover:scale-110"
                                    >
                                        {p.name.trim().charAt(0)}
                                    </span>
                                    <span className="absolute left-4 top-4 rounded-full bg-cream-50/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-clay-500 backdrop-blur">
                                        {p.category}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col gap-2 p-5">
                                    <h2 className="font-serif text-2xl text-forest-700 transition-colors group-hover:text-brand-700">
                                        {p.name}
                                    </h2>
                                    <p className="line-clamp-2 text-sm leading-relaxed text-forest-500">
                                        {p.description}
                                    </p>
                                    <p className="text-xs text-forest-400">By {p.seller.businessName}</p>
                                    <div className="mt-auto flex items-center justify-between border-t border-cream-200 pt-4">
                                        <span className="flex flex-col">
                                            <span className="text-[0.65rem] font-medium uppercase tracking-widest text-forest-400">
                                                from
                                            </span>
                                            <span className="text-lg font-bold text-forest-700">
                                                LKR {lowestPrice(p.variants)}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-all duration-200 ease-soft group-hover:gap-2">
                                            View
                                            <span aria-hidden="true">→</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {!error && items.length > 0 && (
                <p className="text-xs text-forest-400">
                    Showing {items.length} of {total}
                </p>
            )}
        </main>
    );
}
