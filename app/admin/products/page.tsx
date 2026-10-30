'use client';

import { ProductList } from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { catalogueClient } from '../../lib/admin/catalogue-client';

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products & batches"
        description="Every seller's products. Open a product to edit it, or its batches to record new stock."
      />
      <ProductList client={catalogueClient} basePath="/admin/products" showSeller />
    </>
  );
}
