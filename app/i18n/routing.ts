import { defineRouting } from 'next-intl/routing';

/**
 * SDS §NFR — Sri Lankan customers shop in English + Sinhala. We don't
 * change URL paths between locales — locale is resolved from a cookie
 * (`NEXT_LOCALE`) and applied at render time. URL stability matters for
 * shareable links and avoids a duplicate sitemap.
 */
export const routing = defineRouting({
  locales: ['en', 'si'],
  defaultLocale: 'en',
  localePrefix: 'never',
  localeCookie: { name: 'NEXT_LOCALE' },
});

export type AppLocale = (typeof routing.locales)[number];
