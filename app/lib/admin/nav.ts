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

/** The console is served from `/admin` inside the storefront app. */
export const ADMIN_HOME = '/admin';
export const ADMIN_LOGIN = '/admin/login';

/** Whether a pathname belongs to the console rather than the storefront. */
export function isConsolePath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

const BOTH: readonly StaffRole[] = ['ADMIN', 'FULFILMENT_STAFF'];
const ADMIN_ONLY: readonly StaffRole[] = ['ADMIN'];

export const NAV_ITEMS: readonly NavItem[] = [
  { href: ADMIN_HOME, label: 'Dashboard', roles: BOTH, group: 'Operations' },
  { href: '/admin/orders', label: 'Orders', roles: BOTH, group: 'Operations' },
  {
    href: '/admin/fulfilment',
    label: 'Fulfilment queue',
    roles: BOTH,
    badge: 'openOrders',
    group: 'Operations',
  },
  { href: '/admin/deliveries', label: 'Delivery assignments', roles: BOTH, group: 'Operations' },
  { href: '/admin/riders', label: 'Riders', roles: BOTH, group: 'Operations' },
  { href: '/admin/products', label: 'Products & batches', roles: ADMIN_ONLY, group: 'Catalogue' },
  { href: '/admin/bundles', label: 'Gift bundles', roles: ADMIN_ONLY, group: 'Catalogue' },
  {
    href: '/admin/sellers',
    label: 'Sellers',
    roles: ADMIN_ONLY,
    badge: 'pendingSellers',
    group: 'Catalogue',
  },
  {
    href: '/admin/refund-requests',
    label: 'Refund requests',
    roles: ADMIN_ONLY,
    badge: 'refundRequests',
    group: 'Customers',
  },
  { href: '/admin/subscriptions', label: 'Subscriptions', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/admin/reviews', label: 'Review moderation', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/admin/support', label: 'Support tickets', roles: ADMIN_ONLY, group: 'Customers' },
  { href: '/admin/promo-codes', label: 'Promo codes', roles: ADMIN_ONLY, group: 'Settings' },
  { href: '/admin/shipping-rates', label: 'Shipping rates', roles: ADMIN_ONLY, group: 'Settings' },
  { href: '/admin/staff', label: 'Staff accounts', roles: ADMIN_ONLY, group: 'Settings' },
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
    item.href === ADMIN_HOME
      ? pathname === ADMIN_HOME
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
  return href === ADMIN_HOME
    ? pathname === ADMIN_HOME
    : pathname === href || pathname.startsWith(`${href}/`);
}
