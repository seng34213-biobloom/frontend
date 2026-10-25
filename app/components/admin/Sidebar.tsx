'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@biobloom/ui';
import { NAV_GROUPS, isActive, navForRole, type BadgeKey } from '../../lib/admin/nav';
import { humanize } from '../../lib/admin/format';

const BADGE_SUFFIX: Record<BadgeKey, string> = {
  openOrders: 'open orders',
  pendingSellers: 'pending applications',
  refundRequests: 'refund requests awaiting review',
};

/**
 * Persistent, role-aware left sidebar (SDS §6.5). Fulfilment staff only see
 * the operations pages; badges carry a spoken suffix so the count is not
 * conveyed by the pill alone. Collapses behind a disclosure button on small
 * screens so the console reflows at 320px (WCAG 1.4.10).
 */
export function Sidebar({
  role,
  email,
  pathname,
  badges,
  onSignOut,
}: {
  role: string;
  email: string;
  pathname: string;
  badges: Partial<Record<BadgeKey, number>>;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = navForRole(role);

  return (
    <aside className="border-cream-300 bg-cream-100 border-b md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-4 md:block md:px-5 md:py-6">
        <div>
          <p className="text-forest-700 font-serif text-xl">Bio Bloom</p>
          <p className="text-clay-500 text-xs font-semibold uppercase tracking-widest">
            Admin console
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="console-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close menu' : 'Menu'}
        </Button>
      </div>

      <div id="console-nav" className={`${open ? 'block' : 'hidden'} px-3 pb-6 md:block`}>
        <nav aria-label="Console">
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            const headingId = `nav-group-${group.toLowerCase()}`;
            return (
              <div key={group} className="mb-4">
                <p
                  id={headingId}
                  className="text-forest-500 px-2 pb-1 text-xs font-semibold uppercase tracking-widest"
                >
                  {group}
                </p>
                <ul aria-labelledby={headingId} className="space-y-0.5">
                  {groupItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    const count = item.badge ? badges[item.badge] : undefined;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-medium ${
                            active
                              ? 'bg-brand-600 text-cream-50'
                              : 'text-forest-700 hover:bg-cream-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && count ? (
                            <span
                              className={`min-w-[1.5rem] rounded-full px-1.5 text-center text-xs font-bold ${
                                active
                                  ? 'bg-cream-50 text-brand-700'
                                  : 'bg-danger-700 text-cream-50'
                              }`}
                            >
                              {count}
                              <span className="sr-only"> {BADGE_SUFFIX[item.badge]}</span>
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-cream-300 mt-6 space-y-2 border-t px-2 pt-4">
          <p className="text-forest-600 break-all text-xs">
            <span className="text-forest-700 block font-semibold">{email}</span>
            {humanize(role)}
          </p>
          <Button variant="secondary" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
