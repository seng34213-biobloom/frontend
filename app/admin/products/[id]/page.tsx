'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProductEditor } from '@biobloom/ui';
import { PageHeader } from '../../../components/admin/PageHeader';
import { catalogueClient } from '../../../lib/admin/catalogue-client';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <>
      <PageHeader eyebrow="Products" title="Edit product" />
      <ProductEditor
        client={catalogueClient}
        productId={id}
        canPickSeller
        basePath="/products"
        onCreated={(next) => router.replace(`/products/${next}`)}
      />
    </>
  );
}
