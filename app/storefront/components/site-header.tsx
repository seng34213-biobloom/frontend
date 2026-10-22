'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';
import { useAuth } from '../lib/auth-context';

export function SiteHeader() {
  const common = useTranslations('common');
  const nav = useTranslations('nav');
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  const linkClass =
    'group relative text-sm font-medium text-forest-600 transition-colors hover:text-forest-700';
  const underline =
    'absolute -bottom-1 left-0 h-px w-0 bg-forest-700 transition-all duration-300 ease-soft group-hover:w-full';

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2 text-forest-700"
          aria-label={common('brand')}
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-serif text-base font-extrabold text-cream-50 shadow-sm transition-transform duration-300 ease-soft group-hover:rotate-6"
          >
            {common('brand').trim().charAt(0)}
          </span>
          <span className="font-serif text-xl tracking-tightest">
            {common('brand')}
          </span>
        </Link>

        <nav
          className="flex items-center gap-5 sm:gap-7"
          aria-label="Primary"
        >
          <Link href="/products" className={`inline-flex ${linkClass}`}>
            {nav('shop')}
            <span aria-hidden="true" className={underline} />
          </Link>
          <Link
            href="/account/subscriptions"
            className={`hidden md:inline-flex ${linkClass}`}
          >
            {nav('subscriptions')}
            <span aria-hidden="true" className={underline} />
          </Link>

          {loading ? null : user ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-xs text-forest-400 lg:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className={linkClass}
              >
                Sign out
                <span aria-hidden="true" className={underline} />
              </button>
            </>
          ) : (
            <Link href="/login" className={linkClass}>
              {nav('signIn')}
              <span aria-hidden="true" className={underline} />
            </Link>
          )}

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-forest-700/20 px-4 py-2 text-sm font-semibold text-forest-700 transition-all duration-200 ease-soft hover:border-forest-700/40 hover:bg-cream-100 active:scale-[0.98]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 8H6" />
              <circle cx="9.5" cy="20" r="1.2" />
              <circle cx="17.5" cy="20" r="1.2" />
            </svg>
            {nav('cart')}
          </Link>

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
