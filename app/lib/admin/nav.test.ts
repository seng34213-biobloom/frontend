import { describe, expect, it } from 'vitest';
import { canAccess, isActive, isConsolePath, navForRole, navItemFor } from './nav';

describe('console route permissions (SDS §6.5 role-aware navigation)', () => {
  it('shows fulfilment staff only the operations pages', () => {
    const hrefs = navForRole('FULFILMENT_STAFF').map((i) => i.href);
    expect(hrefs).toContain('/admin/fulfilment');
    expect(hrefs).not.toContain('/admin/sellers');
    expect(hrefs).not.toContain('/admin/staff');
  });

  it('refuses customers and sellers everywhere', () => {
    expect(canAccess('/admin', 'CUSTOMER')).toBe(false);
    expect(canAccess('/admin/products', 'SELLER')).toBe(false);
  });

  it('guards typed URLs the same way as the sidebar', () => {
    expect(canAccess('/admin/promo-codes', 'FULFILMENT_STAFF')).toBe(false);
    expect(canAccess('/admin/promo-codes', 'ADMIN')).toBe(true);
    expect(canAccess('/admin/orders/abc', 'FULFILMENT_STAFF')).toBe(true);
  });
});

describe('console paths live under /admin', () => {
  it('links every sidebar entry inside the console', () => {
    for (const role of ['ADMIN', 'FULFILMENT_STAFF'] as const) {
      for (const item of navForRole(role)) {
        expect(item.href === '/admin' || item.href.startsWith('/admin/')).toBe(true);
      }
    }
  });

  it('matches the dashboard only on /admin itself', () => {
    expect(navItemFor('/admin')?.label).toBe('Dashboard');
    expect(navItemFor('/admin/orders/abc')?.label).toBe('Orders');
    expect(isActive('/admin/orders', '/admin')).toBe(false);
    expect(isActive('/admin/orders/abc', '/admin/orders')).toBe(true);
  });

  it('tells console paths apart from storefront paths', () => {
    expect(isConsolePath('/admin')).toBe(true);
    expect(isConsolePath('/admin/orders/abc')).toBe(true);
    expect(isConsolePath('/')).toBe(false);
    expect(isConsolePath('/products')).toBe(false);
    expect(isConsolePath('/administrator')).toBe(false);
  });
});
