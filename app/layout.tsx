import type { Metadata } from 'next';
import { Abhaya_Libre, Anton, Barlow, Noto_Sans_Sinhala } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTimeZone, getTranslations } from 'next-intl/server';
import { AuthProvider } from './lib/auth-context';
import { SiteHeader } from './components/site-header';
import { SiteFooter } from './components/site-footer';
import { StorefrontFrame } from './components/storefront-frame';
import './globals.css';

// Barlow for text, Abhaya Libre for display and Anton for the wordmark. Sinhala
// text uses Abhaya Libre's own glyphs in headings and Noto Sans Sinhala in body.
const body = Barlow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

const display = Abhaya_Libre({
  subsets: ['latin', 'sinhala'],
  display: 'swap',
  variable: '--font-display',
  weight: ['800'],
});

const logo = Anton({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-logo',
  weight: ['400'],
});

const sinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  display: 'swap',
  variable: '--font-sinhala',
  weight: ['400', '500', '600'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: { default: `${t('brand')} — ${t('tagline')}`, template: `%s · ${t('brand')}` },
    description: t('metaDescription'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();
  const t = await getTranslations('common');
  return (
    <html
      lang={locale}
      className={`${body.variable} ${display.variable} ${logo.variable} ${sinhala.variable}`}
    >
      <body className="bg-cream-50 text-forest-700 min-h-screen overflow-x-hidden font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
          <AuthProvider>
            <StorefrontFrame
              skipLink={
                <a
                  href="#main-content"
                  className="caps sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-black focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
                >
                  {t('skipToContent')}
                </a>
              }
              header={<SiteHeader />}
              footer={<SiteFooter />}
            >
              {children}
            </StorefrontFrame>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
