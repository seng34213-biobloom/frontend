'use client';

import { useRouter } from 'next/navigation';
import { ProductEditor } from '@biobloom/ui';
import { PageHeader } from '../../../components/admin/PageHeader';
import { catalogueClient } from '../../../lib/admin/catalogue-client';

export default function NewProductPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader eyebrow="Products" title="Add a product" />
      <ProductEditor
        client={catalogueClient}
        canPickSeller
        basePath="/products"
        onCreated={(id) => router.replace(`/products/${id}`)}
      />
    </>
  );
}
