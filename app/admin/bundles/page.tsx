'use client';

import { BundleManager } from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { catalogueClient } from '../../lib/admin/catalogue-client';

export default function BundlesPage() {
  return (
    <>
      <PageHeader
        title="Gift bundles"
        description="Gift boxes made of several products, sold at one price."
      />
      <BundleManager client={catalogueClient} canPickSeller />
    </>
  );
}
