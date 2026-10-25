'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

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
        onClick={() => setOpen((v) => !v)}
        className="text-forest-600 hover:text-forest-700 inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors"
      >
        {t('menu')}
        <span
          aria-hidden="true"
          className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="border-cream-200 bg-cream-50 absolute left-0 z-50 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border p-2 shadow-lg sm:left-auto sm:right-0"
      >
        <p className="text-forest-500 truncate px-3 pb-2 pt-1 text-xs">
          {t('signedInAs', { email })}
        </p>
        <ul className="space-y-0.5">
          {ACCOUNT_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="text-forest-700 hover:bg-cream-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800 block rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              >
                {t(link.key)}
              </Link>
            </li>
          ))}
          <li className="border-cream-200 border-t pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="text-forest-700 hover:bg-cream-100 block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors"
            >
              {t('signOut')}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
