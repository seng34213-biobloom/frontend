'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { AccountMenu, ACCOUNT_LINKS } from './account-menu';
import { CaretIcon, CartIcon, CloseIcon, MenuIcon, UserIcon } from './icons';
import { LocaleSwitcher } from './locale-switcher';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { KNOWN_CATEGORIES } from '../lib/categories';

const navLink = 'caps block px-5 py-3 text-sm font-medium text-black hover:text-brand-400';

/** SHOP disclosure: Escape closes it, as does clicking away or following a link. */
function ShopMenu() {
  const nav = useTranslations('nav');
  const footer = useTranslations('footer');
  const category = useTranslations('categories');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="caps hover:text-brand-400 inline-flex items-center gap-2 px-5 py-3 text-base font-semibold"
      >
        {nav('shop')}
        <CaretIcon className={`h-2 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="bg-cream-50 absolute left-0 z-50 min-w-[16rem] border border-black"
      >
        <ul className="divide-y divide-black">
          <li>
            <Link href="/products" className={navLink}>
              {footer('allProducts')}
            </Link>
          </li>
          <li>
            <Link href="/bundles" className={navLink}>
              {nav('giftBoxes')}
            </Link>
          </li>
          {KNOWN_CATEGORIES.map((c) => (
            <li key={c}>
              <Link href={`/products?category=${c}`} className={navLink}>
                {category(c)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const common = useTranslations('common');
  const nav = useTranslations('nav');
  const account = useTranslations('account');
  const footer = useTranslations('footer');
  const { user, loading, signOut } = useAuth();
  const { count, openDrawer } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileId = useId();

  useEffect(() => setMobileOpen(false), [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  const cartLabel = `${nav('cart')} (${count})`;
  const cartInner = (
    <>
      <CartIcon />
      <span aria-hidden="true" className="text-sm font-semibold">
        {count}
      </span>
    </>
  );

  return (
    <header className="bg-cream-50 sticky top-0 z-40 border-b border-black">
      <div className="flex items-center justify-between gap-3 px-5 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-7 lg:py-4">
        <Link
          href="/"
          aria-label={common('homeLink')}
          className="font-logo text-[2rem] uppercase sm:text-[2.75rem] lg:text-[3.25rem]"
        >
          {common('brand')}
        </Link>

        <nav className="hidden items-center lg:flex" aria-label={nav('primary')}>
          <ShopMenu />
          <Link href="/bundles" className={`${navLink} !text-base`}>
            {nav('giftBoxes')}
          </Link>
          <Link href="/account/subscriptions" className={`${navLink} !text-base`}>
            {nav('subscriptions')}
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>
          {loading ? null : user ? (
            <div className="hidden lg:block">
              <AccountMenu email={user.email} onSignOut={() => void handleSignOut()} />
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={nav('signIn')}
              className="hover:text-brand-400 hidden p-2 lg:block"
            >
              <UserIcon />
            </Link>
          )}
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls={mobileId}
            aria-label={mobileOpen ? nav('closeMenu') : nav('menu')}
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 lg:hidden"
          >
            {mobileOpen ? <CloseIcon className="h-7 w-7" /> : <MenuIcon />}
          </button>
          {user ? (
            <button
              type="button"
              onClick={openDrawer}
              aria-label={cartLabel}
              className="hover:text-brand-400 flex items-center gap-1.5 p-2"
            >
              {cartInner}
            </button>
          ) : (
            <Link
              href="/cart"
              aria-label={cartLabel}
              className="hover:text-brand-400 flex items-center gap-1.5 p-2"
            >
              {cartInner}
            </Link>
          )}
        </div>
      </div>

      <nav
        id={mobileId}
        hidden={!mobileOpen}
        aria-label={nav('primary')}
        className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-black lg:hidden"
      >
        <ul className="divide-y divide-black">
          <li>
            <Link href="/products" className={navLink}>
              {footer('allProducts')}
            </Link>
          </li>
          <li>
            <Link href="/bundles" className={navLink}>
              {nav('giftBoxes')}
            </Link>
          </li>
          {user ? (
            <>
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={navLink}>
                    {account(link.key)}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className={`${navLink} w-full text-left`}
                >
                  {account('signOut')}
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" className={navLink}>
                {nav('signIn')}
              </Link>
            </li>
          )}
          <li className="px-5 py-3">
            <LocaleSwitcher />
          </li>
        </ul>
      </nav>
    </header>
  );
}
