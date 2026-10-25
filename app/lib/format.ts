/** Display helpers shared by the order screens. */

/** `BB-000042` — the customer-facing order number. */
export function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (orderNumber === null || orderNumber === undefined || !Number.isFinite(orderNumber)) {
    return 'BB-…';
  }
  return `BB-${String(orderNumber).padStart(6, '0')}`;
}

export function addDays(base: Date | string, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Parses an ISO date, returning null for missing or invalid input. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
