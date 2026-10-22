'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Presentational site footer. Static brand mark plus links that already exist
 * elsewhere in the app — no new routes or behaviour, purely visual chrome to
 * round out the premium layout.
 */
export function SiteFooter() {
  const common = useTranslations('common');
  const nav = useTranslations('nav');

  return (
    <footer className="mt-24 border-t border-cream-200 bg-cream-100/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Link
            href="/"
            className="font-serif text-2xl tracking-tightest text-forest-700"
          >
            {common('brand')}
          </Link>
          <p className="text-sm leading-relaxed text-forest-500">
            {common('tagline')}
          </p>
          <p className="text-xs text-forest-400">
            Artisanal jams, chilli sauces &amp; gift boxes — Kalutara, Sri Lanka.
          </p>
        </div>

        <nav
          className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm"
          aria-label="Footer"
        >
          <span className="col-span-2 text-xs font-semibold uppercase tracking-widest text-forest-400">
            {nav('shop')}
          </span>
          <Link
            href="/products"
            className="text-forest-600 transition-colors hover:text-brand-700"
          >
            {nav('shop')}
          </Link>
          <Link
            href="/account/subscriptions"
            className="text-forest-600 transition-colors hover:text-brand-700"
          >
            {nav('subscriptions')}
          </Link>
          <Link
            href="/cart"
            className="text-forest-600 transition-colors hover:text-brand-700"
          >
            {nav('cart')}
          </Link>
          <Link
            href="/login"
            className="text-forest-600 transition-colors hover:text-brand-700"
          >
            {nav('signIn')}
          </Link>
        </nav>
      </div>

      <div className="border-t border-cream-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5 text-xs text-forest-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {common('brand')} 2026 · Handcrafted in small batches.
          </span>
          <span>Made with care in Sri Lanka.</span>
        </div>
      </div>
    </footer>
  );
}
