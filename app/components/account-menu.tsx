'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { UserIcon } from './icons';

export const ACCOUNT_LINKS = [
  { href: '/account/orders', key: 'orders' },
  { href: '/account/subscriptions', key: 'subscriptions' },
  { href: '/account/addresses', key: 'addresses' },
  { href: '/account/support', key: 'support' },
] as const;

/**
 * Header account menu (SDS §6.1). A disclosure button revealing a list of
 * links: Escape closes it and returns focus to the button, as does clicking
 * outside or following a link.
 */
export function AccountMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const t = useTranslations('account');
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        aria-label={t('menu')}
        onClick={() => setOpen((v) => !v)}
        className="hover:text-brand-400 block p-2"
      >
        <UserIcon />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="bg-cream-50 absolute left-0 z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] border border-black sm:left-auto sm:right-0"
      >
        <p className="truncate border-b border-black px-5 py-3 text-sm">
          {t('signedInAs', { email })}
        </p>
        <ul className="divide-y divide-black">
          {ACCOUNT_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="caps hover:bg-sun aria-[current=page]:bg-blush block px-5 py-3 text-sm font-medium"
              >
                {t(link.key)}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="caps hover:bg-sun block w-full px-5 py-3 text-left text-sm font-medium"
            >
              {t('signOut')}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
