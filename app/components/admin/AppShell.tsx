'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../lib/admin/auth-context';
import { ADMIN_LOGIN, isStaffRole } from '../../lib/admin/nav';
import { useNavBadges } from '../../lib/admin/use-nav-badges';
import { PageAccess, RouteGuard } from './RouteGuard';
import { Sidebar } from './Sidebar';

const PUBLIC_PATHS = new Set([ADMIN_LOGIN]);

function ConsoleLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const role = user && isStaffRole(user.role) ? user.role : null;
  const badges = useNavBadges(role, pathname);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        role={user.role}
        email={user.email}
        pathname={pathname}
        badges={badges}
        onSignOut={() => {
          void signOut().then(() => router.replace(ADMIN_LOGIN));
        }}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex w-full min-w-0 flex-1 flex-col gap-7 px-4 py-7 sm:px-7"
      >
        <PageAccess>{children}</PageAccess>
      </main>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  if (PUBLIC_PATHS.has(pathname)) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen items-center justify-center px-4 py-12"
      >
        {children}
      </main>
    );
  }
  return (
    <RouteGuard>
      <ConsoleLayout>{children}</ConsoleLayout>
    </RouteGuard>
  );
}

/** Client root: session context, guard, sidebar and the single `<main>`. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
