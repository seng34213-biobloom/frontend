import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BundleCard } from '../components/bundle-card';
import { PageHeader } from '../components/page-header';
import { bundleList } from '../lib/bundles';
import { serverGet } from '../lib/server-api';
import type { Bundle } from '../lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('bundles');
  return { title: `${t('heading')} — Bio Bloom` };
}

/** Gift boxes (SDS §1.2, §6.1). */
export default async function BundlesPage() {
  const t = await getTranslations('bundles');
  const bundles = bundleList(await serverGet<Bundle[] | { items: Bundle[] }>('/api/bundles'));
  return (
    <div>
      <PageHeader title={t('heading')} lead={t('lead')} />
      {bundles.length === 0 ? (
        <p className="band px-7 py-32 text-center text-xl font-semibold">{t('empty')}</p>
      ) : (
        <ul className="ruled-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((b) => (
            <li key={b.id}>
              <BundleCard bundle={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
