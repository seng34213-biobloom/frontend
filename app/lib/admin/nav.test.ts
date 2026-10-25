import { describe, expect, it } from 'vitest';
import { canAccess, navForRole } from './nav';

describe('console route permissions (SDS §6.5 role-aware navigation)', () => {
  it('shows fulfilment staff only the operations pages', () => {
    const hrefs = navForRole('FULFILMENT_STAFF').map((i) => i.href);
    expect(hrefs).toContain('/fulfilment');
    expect(hrefs).not.toContain('/sellers');
    expect(hrefs).not.toContain('/staff');
  });

  it('refuses customers and sellers everywhere', () => {
    expect(canAccess('/', 'CUSTOMER')).toBe(false);
    expect(canAccess('/products', 'SELLER')).toBe(false);
  });

  it('guards typed URLs the same way as the sidebar', () => {
    expect(canAccess('/promo-codes', 'FULFILMENT_STAFF')).toBe(false);
    expect(canAccess('/promo-codes', 'ADMIN')).toBe(true);
    expect(canAccess('/orders/abc', 'FULFILMENT_STAFF')).toBe(true);
  });
});
