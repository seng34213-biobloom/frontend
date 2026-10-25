import type { Bundle, BundleComponent } from './types';

/** Normalises the bundle component list across API field names. */
export function bundleComponents(bundle: Bundle): Array<{
  key: string;
  quantity: number;
  productName: string;
  productSlug?: string;
  variantLabel: string;
}> {
  const raw: BundleComponent[] = bundle.items ?? bundle.components ?? [];
  return raw.map((c, i) => {
    const productName = c.productName ?? c.product?.name ?? c.variant?.product?.name ?? '';
    const productSlug = c.productSlug ?? c.product?.slug ?? c.variant?.product?.slug;
    const variantLabel = c.size ?? c.variant?.size ?? c.variantName ?? c.variant?.name ?? '';
    return {
      key: `${productSlug ?? productName}-${variantLabel}-${i}`,
      quantity: c.quantity,
      productName,
      productSlug,
      variantLabel,
    };
  });
}

/** Units of the bundle that can be sold now, when the API reports it. */
export function bundleAvailability(bundle: Bundle): number | null {
  const value = bundle.available ?? bundle.stockAvailable;
  return typeof value === 'number' ? value : null;
}

/** `GET /api/bundles` may answer with a bare array or a paged envelope. */
export function bundleList(payload: Bundle[] | { items: Bundle[] } | null): Bundle[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : (payload.items ?? []);
}
