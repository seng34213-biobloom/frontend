import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing, type AppLocale } from './routing';

export const TIME_ZONE = 'Asia/Colombo';

export default getRequestConfig(async () => {
  let locale: AppLocale = routing.defaultLocale;

  try {
    const cookieStore = cookies();
    const fromCookie = cookieStore.get('NEXT_LOCALE')?.value;
    if (fromCookie && (routing.locales as readonly string[]).includes(fromCookie)) {
      locale = fromCookie as AppLocale;
    }
  } catch {
    // Fall back to defaultLocale if cookies() cannot be read (e.g. static generation)
  }

  const messages = (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages;

  return {
    locale,
    messages,
    timeZone: TIME_ZONE,
  };
});
