'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, Button, Spinner } from '@biobloom/ui';
import { useAuth } from '../../lib/admin/auth-context';
import { canAccess, isStaffRole } from '../../lib/admin/nav';
import { AccessDenied } from './AccessDenied';

/** Wrapper used for every non-content state so the page keeps one `<main>`. */
function GuardMain({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-16">
      {children}
    </main>
  );
}

/**
 * Console route guard (DDP-#31 AC2). Anonymous visitors are sent to
 * `/login?next=<path>`; signed-in customers, sellers and riders get an
 * access-denied message. Children (and therefore any admin data fetches)
 * only mount once the session is confirmed to belong to staff.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh, signOut } = useAuth();
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  const anonymous = !loading && !error && !user;

  useEffect(() => {
    if (anonymous) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [anonymous, pathname, router]);

  if (loading) {
    return (
      <GuardMain>
        <Spinner label="Checking your session…" />
      </GuardMain>
    );
  }

  if (error) {
    return (
      <GuardMain>
        <Alert tone="error" title="Could not reach the Bio Bloom API">
          <p>{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => void refresh()}>
            Try again
          </Button>
        </Alert>
      </GuardMain>
    );
  }

  if (!user) {
    return (
      <GuardMain>
        <Spinner label="Redirecting to sign in…" />
      </GuardMain>
    );
  }

  const leave = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!isStaffRole(user.role)) {
    return (
      <GuardMain>
        <AccessDenied
          email={user.email}
          message="The admin console is only available to Bio Bloom staff accounts."
          onSignOut={() => void leave()}
        />
      </GuardMain>
    );
  }

  return <>{children}</>;
}

/**
 * Page-level check inside the console shell: fulfilment staff keep the
 * sidebar but see a refusal instead of an admin-only page's content.
 */
export function PageAccess({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname() ?? '/';
  if (!user || !canAccess(pathname, user.role)) {
    return (
      <AccessDenied
        email={user?.email}
        message="This page is only available to administrators. Use the navigation to open a page you can access."
      />
    );
  }
  return <>{children}</>;
}
