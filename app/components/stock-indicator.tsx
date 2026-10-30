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
      <span className="bg-blush caps inline-flex items-center gap-2 border border-black px-2.5 py-0.5 text-sm font-medium">
        {t('outOfStock')}
      </span>
    );
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <span className="bg-sun caps inline-flex items-center gap-2 border border-black px-2.5 py-0.5 text-sm font-medium">
        {t('onlyNLeft', { n: stock })}
      </span>
    );
  }
  return (
    <span className="bg-leaf caps inline-flex items-center gap-2 border border-black px-2.5 py-0.5 text-sm font-medium">
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
