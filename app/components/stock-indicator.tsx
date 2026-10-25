import { useTranslations } from 'next-intl';

export const LOW_STOCK_THRESHOLD = 10;

/**
 * FIFO stock badge (SDS §6.2). Text + colour, never colour alone. Wrap it in
 * a polite live region where it changes in place so screen readers announce
 * the new level (WCAG 4.1.3).
 */
export function StockBadge({ stock }: { stock: number }) {
  const t = useTranslations('stock');
  if (stock <= 0) {
    return (
      <span className="bg-danger-100 text-danger-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        <span aria-hidden="true" className="bg-danger-500 h-1.5 w-1.5 rounded-full" />
        {t('outOfStock')}
      </span>
    );
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-600" />
        {t('onlyNLeft', { n: stock })}
      </span>
    );
  }
  return (
    <span className="bg-brand-100 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
      <span aria-hidden="true" className="bg-brand-500 h-1.5 w-1.5 rounded-full" />
      {t('inStock')}
    </span>
  );
}

export function StockIndicator({ stock, id }: { stock: number; id?: string }) {
  return (
    <p id={id} aria-live="polite" aria-atomic="true" data-testid="stock-indicator" className="m-0">
      <StockBadge stock={stock} />
    </p>
  );
}
