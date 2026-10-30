'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { routing, type AppLocale } from '../i18n/routing';

/**
 * en ↔ si switcher. Sets the next-intl locale cookie (`NEXT_LOCALE`) and
 * triggers a router refresh so server components re-render with the new
 * messages. Path stability is preserved — we use `localePrefix: 'never'`.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: AppLocale): void {
    if (next === locale) return;
    // routing.localeCookie is `{ name: 'NEXT_LOCALE' }` per i18n/routing.ts.
    const cookieName =
      typeof routing.localeCookie === 'object' && routing.localeCookie
        ? routing.localeCookie.name
        : 'NEXT_LOCALE';
    document.cookie = `${cookieName}=${next}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center divide-x divide-black border border-black text-sm">
      <span className="sr-only">{t('language')}</span>
      {(routing.locales as readonly AppLocale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
          disabled={isPending}
          className={`px-2.5 py-1 font-medium ${l === locale ? 'bg-black text-white' : 'hover:bg-sun text-black'}`}
        >
          {l === 'en' ? 'EN' : 'සිං'}
        </button>
      ))}
    </div>
  );
}
