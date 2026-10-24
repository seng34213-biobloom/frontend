import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async () => {
    // URLs carry no locale prefix, so the locale comes from the cookie the switcher sets
    let locale = cookies().get('NEXT_LOCALE')?.value;

    // Validate against the supported locales; fall back to the default
    if (!locale || !routing.locales.includes(locale as 'en' | 'si')) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
