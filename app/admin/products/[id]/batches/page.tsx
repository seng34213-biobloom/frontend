'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BatchManager } from '@biobloom/ui';
import { PageHeader } from '../../../../components/admin/PageHeader';
import { catalogueClient } from '../../../../lib/admin/catalogue-client';

/** SDS §6.6 batch management screen. */
export default function BatchesPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Batch management"
        actions={
          <Link href={`/products/${id}`} className="underline">
            Edit product
          </Link>
        }
      />
      <BatchManager client={catalogueClient} productId={id} />
    </>
  );
}
