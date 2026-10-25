'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { isApiError } from './api';
import { useAuth } from './auth-context';
import { currentPath, loginHref } from './navigation';

/**
 * Client-side guard for customer-only screens. The auth cookie lives on the
 * API origin, so the storefront cannot see it in middleware; the guard asks
 * `GET /api/auth/me` (via AuthProvider) and sends anonymous visitors to
 * `/login?next=<current path>`.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(loginHref(currentPath()));
  }, [loading, user, router]);

  return { user, ready: !loading && user !== null };
}

/**
 * Returns a handler for API errors that redirects to sign-in on 401 (an
 * expired session) and reports whether it did.
 */
export function useSessionExpiryRedirect() {
  const router = useRouter();
  const { refresh } = useAuth();
  return useCallback(
    (e: unknown): boolean => {
      if (!isApiError(e, 401)) return false;
      void refresh();
      router.replace(loginHref(currentPath()));
      return true;
    },
    [router, refresh],
  );
}
