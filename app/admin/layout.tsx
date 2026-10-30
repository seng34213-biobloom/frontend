import type { Metadata } from 'next';
import { AppShell } from '../components/admin/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bio Bloom — Admin Console',
  description: 'Internal admin dashboard for Bio Bloom operations.',
  robots: { index: false, follow: false },
};

/**
 * Console layout. It is nested inside the storefront root layout, which owns
 * `<html>` and `<body>` and leaves its own header, footer and `<main>` off
 * `/admin` routes (see StorefrontFrame).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-console className="bg-cream-50 text-forest-700 min-h-screen font-sans antialiased">
      <a
        href="#main-content"
        className="focus:bg-forest-700 focus:text-white sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <AppShell>{children}</AppShell>
    </div>
  );
}
