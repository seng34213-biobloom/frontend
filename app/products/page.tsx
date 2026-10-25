import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '../components/page-header';
import { ProductCard } from '../components/product-card';
import { Pagination } from '../components/pagination';
import { buttonClass } from '../components/button-styles';
import { inputClass, labelTextClass } from '../components/form-field';
import { serverGet } from '../lib/server-api';
import { KNOWN_CATEGORIES } from '../lib/categories';
import type { ProductPage } from '../lib/types';

/**
 * Customer-facing product grid (SDS §5.2 + §6.2). Server component so the
 * catalogue is SSR-rendered for SEO. Filters live in the query string, so the
 * plain GET form works without JavaScript. An unreachable API throws to
 * `products/error.tsx`.
 */

const PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('products');
  return { title: t('metaTitle') };
}

function single(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations('products');
  const tCategory = await getTranslations('categories');
  const category = single(searchParams.category);
  const search = single(searchParams.search);
  const page = Math.max(1, Number(single(searchParams.page)) || 1);

  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (category) qs.set('category', category);
  if (search) qs.set('search', search);
  const data = (await serverGet<ProductPage>(`/api/products?${qs}`)) ?? { items: [], total: 0 };
  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const filtered = Boolean(category || search);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} lead={t('intro')} />

      <form
        method="get"
        action="/products"
        role="search"
        aria-label={t('filtersLabel')}
        className="border-cream-200 bg-cream-50 grid gap-4 rounded-3xl border p-5 shadow-sm sm:grid-cols-[1fr_2fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="filter-category" className={labelTextClass}>
            {t('category')}
          </label>
          <select
            id="filter-category"
            name="category"
            defaultValue={category ?? ''}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">{t('allCategories')}</option>
            {KNOWN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCategory(c)}
              </option>
            ))}
            {category && !(KNOWN_CATEGORIES as readonly string[]).includes(category) && (
              <option value={category}>{category}</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="filter-search" className={labelTextClass}>
            {t('search')}
          </label>
          <input
            id="filter-search"
            type="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder={t('searchPlaceholder')}
            maxLength={120}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={buttonClass('primary')}>
            {t('apply')}
          </button>
          {filtered && (
            <Link href="/products" className={buttonClass('ghost')}>
              {t('clear')}
            </Link>
          )}
        </div>
      </form>

      <p role="status" className="text-forest-500 text-sm">
        {t('showing', { count: data.items.length, total: data.total })}
      </p>

      {data.items.length === 0 ? (
        <div className="border-cream-300 bg-cream-100/50 flex flex-col items-center gap-4 rounded-3xl border border-dashed px-6 py-20 text-center">
          <span aria-hidden="true" className="text-4xl">
            🌿
          </span>
          <p className="text-forest-500 text-lg">{filtered ? t('noMatches') : t('emptyState')}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <li
              key={p.id}
              className="animate-fade-up [animation-fill-mode:both]"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        basePath="/products"
        params={{ category, search }}
      />
    </div>
  );
}
