import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { cookies, headers } from 'next/headers';
import { routing, type AppLocale } from './routing';

/** Prices, delivery estimates and billing dates are shown in Sri Lankan time. */
export const TIME_ZONE = 'Asia/Colombo';

/**
 * Cookie-only locale detection (no next-intl middleware → no path rewrites).
 *   1. `NEXT_LOCALE` cookie wins if set (the locale switcher writes it).
 *   2. Fallback to the first supported `Accept-Language` tag.
 *   3. Fallback to the configured default locale.
 *
 * URLs stay locale-agnostic so deep links don't break when a customer flips
 * between en ↔ si.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('NEXT_LOCALE')?.value;
  let locale: AppLocale = routing.defaultLocale;
  if (fromCookie && (routing.locales as readonly string[]).includes(fromCookie)) {
    locale = fromCookie as AppLocale;
  } else {
    const accept = (await headers()).get('accept-language') ?? '';
    const ranked = accept
      .split(',')
      .map((entry) => entry.trim().split(';')[0].toLowerCase().split('-')[0]);
    const match = ranked.find((tag) => (routing.locales as readonly string[]).includes(tag));
    if (match) locale = match as AppLocale;
  }
  const messages = (await import(`./messages/${locale}.json`)).default as AbstractIntlMessages;
  return { locale, messages, timeZone: TIME_ZONE };
});
