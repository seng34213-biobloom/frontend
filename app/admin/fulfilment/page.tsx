'use client';

import { FulfilmentQueue } from '../../components/admin/FulfilmentQueue';
import { PageHeader } from '../../components/admin/PageHeader';

/** SDS §6.7 fulfilment flow: pack, ship, assign a rider, retry failed deliveries. */
export default function FulfilmentPage() {
  return (
    <>
      <PageHeader
        title="Fulfilment queue"
        description="Paid orders waiting to be packed and shipped, and shipped orders waiting for a rider."
      />
      <FulfilmentQueue />
    </>
  );
}
