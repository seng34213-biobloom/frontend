/** Display helpers shared by the console pages. */

export function fmtMoney(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return `LKR ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Order numbers display as `BB-` plus six zero-padded digits. */
export function fmtOrderNumber(
  orderNumber: number | null | undefined,
  fallbackId?: string,
): string {
  if (typeof orderNumber === 'number') return `BB-${String(orderNumber).padStart(6, '0')}`;
  return fallbackId ? fallbackId.slice(0, 8) : '—';
}

/** `PENDING_PAYMENT` -> `Pending payment`. */
export function humanize(value: string): string {
  const lower = value.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
