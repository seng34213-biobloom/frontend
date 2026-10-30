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
    <aside className="bg-cream-50 border-b border-black md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-3 border-black px-5 py-4 md:block md:border-b md:py-5">
        <div>
          <p className="font-logo text-[2.25rem] uppercase">Bio Bloom</p>
          <p className="caps mt-1 text-xs font-medium">Admin console</p>
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

      <div
        id="console-nav"
        className={`${open ? 'block' : 'hidden'} border-t border-black md:block md:border-t-0`}
      >
        <nav aria-label="Console">
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            const headingId = `nav-group-${group.toLowerCase()}`;
            return (
              <div key={group} className="border-b border-black">
                <p
                  id={headingId}
                  className="bg-sky caps border-b border-black px-5 py-1 text-xs font-medium"
                >
                  {group}
                </p>
                <ul aria-labelledby={headingId} className="divide-y divide-black">
                  {groupItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    const count = item.badge ? badges[item.badge] : undefined;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                          className={`caps flex items-center justify-between gap-2 px-5 py-2.5 text-xs font-medium ${
                            active ? 'bg-black text-white' : 'hover:bg-sun text-black'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && count ? (
                            <span className="bg-blush min-w-[1.5rem] border border-black px-1.5 text-center text-xs font-semibold text-black">
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

        <div className="space-y-2 p-5">
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
