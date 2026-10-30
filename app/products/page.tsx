import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ProductCard } from '../components/product-card';
import { Pagination } from '../components/pagination';
import { buttonClass } from '../components/button-styles';
import { inputClass } from '../components/form-styles';
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
    <div>
      <div className="ruled-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <header className="flex flex-col justify-center gap-1 p-7">
          <h1 className="caps break-words font-serif text-xl">{t('metaTitle')}</h1>
          <p role="status" className="text-sm">
            {t('showing', { count: data.items.length, total: data.total })}
          </p>
        </header>
        <form
          id="catalogue-filters"
          method="get"
          action="/products"
          role="search"
          aria-label={t('filtersLabel')}
          className="contents"
        >
          <div className="border-b border-r border-black p-5">
            <label htmlFor="filter-category" className="caps block text-sm font-medium">
              {t('category')}
            </label>
            <select
              id="filter-category"
              name="category"
              defaultValue={category ?? ''}
              className={`${inputClass} mt-1 !py-3`}
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
          <div className="border-b border-r border-black p-5">
            <label htmlFor="filter-search" className="caps block text-sm font-medium">
              {t('search')}
            </label>
            <input
              id="filter-search"
              type="search"
              name="search"
              defaultValue={search ?? ''}
              placeholder={t('searchPlaceholder')}
              maxLength={120}
              className={`${inputClass} mt-1 !py-3`}
            />
          </div>
          <div className="flex items-end gap-2 border-b border-r border-black p-5">
            <button type="submit" className={buttonClass('primary', 'flex-1')}>
              {t('apply')}
            </button>
            {filtered && (
              <Link href="/products" className={buttonClass('secondary', 'flex-1')}>
                {t('clear')}
              </Link>
            )}
          </div>
        </form>
      </div>

      {data.items.length === 0 ? (
        <div className="band flex flex-col items-center gap-4 px-7 py-32 text-center">
          <p className="text-xl font-semibold">{filtered ? t('noMatches') : t('emptyState')}</p>
        </div>
      ) : (
        <ul className="ruled-grid grid-cols-2 lg:grid-cols-4">
          {data.items.map((p) => (
            <li key={p.id}>
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
