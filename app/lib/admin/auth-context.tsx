'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, adminApi } from './api';
import type { Role } from './nav';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  actorType: string;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  /** Set when `/api/auth/me` failed for a reason other than "not signed in". */
  error: string | null;
  refresh: () => Promise<CurrentUser | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Session state for the console, read from `GET /api/auth/me`. The JWT
 * itself is an HTTP-only cookie (SDS §7.1); this context only mirrors who
 * the cookie belongs to so the guard and sidebar can react to it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await adminApi<CurrentUser>('GET', '/api/auth/me');
      setUser(me);
      setError(null);
      return me;
    } catch (e) {
      setUser(null);
      setError(e instanceof ApiError && e.status === 401 ? null : (e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await adminApi('POST', '/api/auth/logout');
    } catch {
      // Logout must always clear local state, even if the token already expired.
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, refresh, signOut }),
    [user, loading, error, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
