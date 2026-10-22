import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // requestLocale is the locale resolved from the cookie / URL
    let locale = await requestLocale;

    // Validate against the supported locales; fall back to the default
    if (!locale || !routing.locales.includes(locale as 'en' | 'si')) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
