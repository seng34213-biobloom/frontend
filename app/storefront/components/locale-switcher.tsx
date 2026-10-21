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
    <div className="inline-flex items-center gap-1 rounded-full border border-cream-300 bg-cream-50 p-1 text-xs">
      <span className="sr-only">{t('language')}</span>
      {(routing.locales as readonly AppLocale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
          disabled={isPending}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            l === locale
              ? 'bg-brand-600 text-cream-50'
              : 'text-forest-600 hover:bg-cream-200'
          }`}
        >
          {l === 'en' ? 'EN' : 'සිං'}
        </button>
      ))}
    </div>
  );
}
