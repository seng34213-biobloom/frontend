/**
 * Integer-cent arithmetic for the few totals the storefront previews before
 * the API answers (subscription summary). The API stays authoritative and
 * serialises money as 2-dp strings, so we never round through JS floats.
 */

export function toCents(value: string | number): number {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim();
  const negative = raw.startsWith('-');
  const [whole = '0', fraction = ''] = raw.replace(/^[-+]/, '').split('.');
  const cents = Number(whole || '0') * 100 + Number((fraction + '00').slice(0, 2));
  if (!Number.isFinite(cents)) return 0;
  return negative ? -cents : cents;
}

export function fromCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  return `${negative ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** `rate` is a decimal string such as `0.1000`; returns the discount in cents. */
export function discountCents(cents: number, rate: string | number): number {
  const basisPoints = Math.round(Number(rate) * 10_000);
  if (!Number.isFinite(basisPoints) || basisPoints <= 0) return 0;
  return Math.round((cents * basisPoints) / 10_000);
}

export function ratePercent(rate: string | number): number {
  return Math.round(Number(rate) * 1000) / 10;
}

/** Lowest variant price as a 2-dp string, or null when there are none. */
export function lowestPrice(variants: Array<{ price: string }>): string | null {
  if (variants.length === 0) return null;
  const min = Math.min(...variants.map((v) => toCents(v.price)));
  return fromCents(min);
}
