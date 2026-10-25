'use client';

import { useEffect, useState } from 'react';
import { adminApi, rowsOf, type Paginated } from './api';
import type { BadgeKey, StaffRole } from './nav';

export type NavBadges = Partial<Record<BadgeKey, number>>;

const SOURCES: Record<BadgeKey, { path: string; roles: readonly StaffRole[] }> = {
  openOrders: { path: '/api/admin/fulfilment/open', roles: ['ADMIN', 'FULFILMENT_STAFF'] },
  pendingSellers: { path: '/api/admin/sellers/pending', roles: ['ADMIN'] },
  refundRequests: { path: '/api/admin/refund-requests?status=REQUESTED', roles: ['ADMIN'] },
};

/**
 * Counts behind the sidebar notification badges (SDS §6.5). Only queries the
 * endpoints the role may call, and refreshes whenever `refreshKey` changes
 * (the shell passes the pathname, so counts update after each navigation).
 */
export function useNavBadges(role: StaffRole | null, refreshKey: string): NavBadges {
  const [badges, setBadges] = useState<NavBadges>({});

  useEffect(() => {
    if (!role) return undefined;
    let cancelled = false;
    const keys = (Object.keys(SOURCES) as BadgeKey[]).filter((k) =>
      SOURCES[k].roles.includes(role),
    );
    void Promise.allSettled(
      keys.map((k) => adminApi<unknown[] | Paginated<unknown>>('GET', SOURCES[k].path)),
    ).then((results) => {
      if (cancelled) return;
      const next: NavBadges = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[keys[i]] = rowsOf(r.value).length;
      });
      setBadges(next);
    });
    return () => {
      cancelled = true;
    };
  }, [role, refreshKey]);

  return badges;
}
