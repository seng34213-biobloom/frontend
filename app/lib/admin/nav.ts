/**
 * Console navigation and route permissions (SDS §6.5 role-aware sidebar,
 * §6.7 admin flow). The same table drives the sidebar and the route guard,
 * so a page hidden from a role is also refused when typed into the URL.
 */

export type Role = 'CUSTOMER' | 'ADMIN' | 'FULFILMENT_STAFF' | 'SELLER' | 'DELIVERY';
export type StaffRole = 'ADMIN' | 'FULFILMENT_STAFF';

export const STAFF_ROLES: readonly StaffRole[] = ['ADMIN', 'FULFILMENT_STAFF'];

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === 'ADMIN' || role === 'FULFILMENT_STAFF';
}

export type BadgeKey = 'pendingSellers' | 'refundRequests' | 'openOrders';

export interface NavItem {
  href: string;
  label: string;
  roles: readonly StaffRole[];
  badge?: BadgeKey;
  group: 'Operations' | 'Catalogue' | 'Customers' | 'Settings';
}

const BOTH: readonly StaffRole[] = ['ADMIN', 'FULFILMENT_STAFF'];
const ADMIN_ONLY: readonly StaffRole[] = ['ADMIN'];

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', roles: BOTH, group: 'Operations' },
  { href: '/orders', label: 'Orders', roles: BOTH, group: 'Operations' },
  {
    href: '/fulfilment',
    label: 'Fulfilment queue',
    roles: BOTH,
    badge: 'openOrders',
    group: 'Operations',
  },
  { href: '/deliveries', label: 'Delivery assignments', roles: BOTH, group: 'Operations' },
  { href: '/riders', label: 'Riders', roles: BOTH, group: 'Operations' },
  { href: '/products', label: 'Products & batches', roles: ADMIN_ONLY, group: 'Catalogue' },
  { href: '/bundles', label: 'Gift bundles', roles: ADMIN_ONLY, group: 'Catalogue' },
  {
    href: '/sellers',
    label: 'Sellers',
    roles: ADMIN_ONLY,
    badge: 'pendingSellers',
    group: 'Catalogue',
  },
  {
    href: '/refund-requests',
    label: 'Refund requests',
    roles: ADMIN_ONLY,
    badge: 'refundRequests',
    group: 'Customers',
  },
  { href: '/subscriptions', label: 'Subscriptions', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/reviews', label: 'Review moderation', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/support', label: 'Support tickets', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/promo-codes', label: 'Promo codes', roles: ADMIN_ONLY, group: 'Settings' },
  { href: '/shipping-rates', label: 'Shipping rates', roles: ADMIN_ONLY, group: 'Settings' },
  { href: '/staff', label: 'Staff accounts', roles: ADMIN_ONLY, group: 'Settings' },
];

export const NAV_GROUPS: readonly NavItem['group'][] = [
  'Operations',
  'Catalogue',
  'Customers',
  'Settings',
];

export function navForRole(role: string | null | undefined): NavItem[] {
  if (!isStaffRole(role)) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Finds the nav entry that owns a pathname (longest matching prefix). */
export function navItemFor(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) =>
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Whether `role` may open `pathname`. Unknown console paths are admin-only. */
export function canAccess(pathname: string, role: string | null | undefined): boolean {
  if (!isStaffRole(role)) return false;
  const item = navItemFor(pathname);
  if (!item) return role === 'ADMIN';
  return item.roles.includes(role);
}

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
