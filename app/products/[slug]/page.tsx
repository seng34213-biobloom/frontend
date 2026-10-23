import { notFound } from 'next/navigation';
import { VariantPanel } from './variant-panel';

/**
 * Product Detail Page (SDS §6.2). Server component for SEO. Renders product
 * basics + hands variant interactivity (selector, FIFO stock indicator,
 * Subscribe & Save toggle) to the client `VariantPanel`.
 *
 * The Subscribe & Save toggle is a visual stub here — actual subscription
 * creation lands in Phase 6 (`POST /api/subscriptions`).
 */

const API_INTERNAL =
    process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:4000';

interface ProductDetail {
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
    stockByVariant: Record<string, number>;
    earliestExpiryByVariant: Record<string, string | null>;
}

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
    try {
        const res = await fetch(`${API_INTERNAL}/api/products/${encodeURIComponent(slug)}`, {
            cache: 'no-store',
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`API ${res.status}`);
        return (await res.json()) as ProductDetail;
    } catch {
        return null;
    }
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await fetchProduct(slug);
    if (!product) notFound();

    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
            <nav className="text-sm" aria-label="Breadcrumb">
                <a
                    href="/products"
                    className="inline-flex items-center gap-1 font-medium text-brand-700 transition-all duration-200 ease-soft hover:gap-2 hover:text-brand-900"
                >
                    <span aria-hidden="true">←</span> All products
                </a>
            </nav>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
                {/* Artisan-label image stand-in (no photo field in the data model). */}
                <div
                    aria-hidden="true"
                    className="label-panel relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-cream-200 shadow-md lg:sticky lg:top-24 lg:self-start"
                >
                    <span className="absolute left-6 top-6 rounded-full bg-cream-50/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-clay-500 backdrop-blur">
                        {product.category}
                    </span>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <span className="font-serif text-[8rem] leading-none tracking-tightest text-forest-700/15">
                            {product.name.trim().charAt(0)}
                        </span>
                        <span className="font-serif text-lg text-forest-700/40">
                            {product.seller.businessName}
                        </span>
                    </div>
                    <span className="absolute bottom-6 right-6 text-brand-500">✦✦✦</span>
                </div>

                <div className="flex flex-col gap-8">
                    <header className="space-y-3 animate-fade-up">
                        <span className="inline-flex rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
                            {product.category}
                        </span>
                        <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">
                            {product.name}
                        </h1>
                        <p className="text-sm font-medium text-forest-400">
                            By {product.seller.businessName}
                        </p>
                        <p className="max-w-2xl text-lg leading-relaxed text-forest-600">
                            {product.description}
                        </p>
                    </header>

                    <VariantPanel
                        productSlug={product.slug}
                        variants={product.variants}
                        stockByVariant={product.stockByVariant}
                        earliestExpiryByVariant={product.earliestExpiryByVariant}
                    />
                </div>
            </div>
        </main>
    );
}
