'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCOUNT_LINKS } from './account-menu';
import { NewsletterForm } from './newsletter-form';

const linkClass = 'caps text-sm font-medium hover:text-brand-400';

/**
 * Site footer: link columns and the newsletter over ruled bands. Every link
 * points at a route that already exists in the app.
 */
export function SiteFooter() {
  const common = useTranslations('common');
  const nav = useTranslations('nav');
  const footer = useTranslations('footer');
  const account = useTranslations('account');

  return (
    <footer className="border-t border-black">
      <div className="grid md:grid-cols-[1fr_1fr_1fr]">
        <nav
          aria-label={footer('navLabel')}
          className="col-span-2 grid grid-cols-2 border-b border-black md:border-b-0"
        >
          <ul className="flex flex-col gap-6 p-7 md:items-end md:pr-7">
            <li className="md:w-44">
              <Link href="/products" className={linkClass}>
                {footer('allProducts')}
              </Link>
            </li>
            <li className="md:w-44">
              <Link href="/bundles" className={linkClass}>
                {nav('giftBoxes')}
              </Link>
            </li>
            <li className="md:w-44">
              <Link href="/cart" className={linkClass}>
                {nav('cart')}
              </Link>
            </li>
            <li className="md:w-44">
              <Link href="/login" className={linkClass}>
                {nav('signIn')}
              </Link>
            </li>
          </ul>
          <ul className="flex flex-col gap-6 border-l border-black p-7">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {account(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-span-2 border-black p-7 md:col-span-1 md:border-l">
          <NewsletterForm />
        </div>
      </div>

      <p className="border-t border-black px-7 py-7 text-center text-sm">{footer('about')}</p>

      <div className="flex flex-wrap items-center justify-end gap-x-7 gap-y-1 border-t border-black px-7 py-7 text-sm">
        <span>{common('tagline')}</span>
        <span>{footer('madeIn')}</span>
      </div>

      <p className="border-t border-black px-7 py-3 text-sm">
        {footer('copyright', { year: new Date().getFullYear(), brand: common('brand') })}
      </p>
    </footer>
  );
}
