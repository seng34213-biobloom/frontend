import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTimeZone, getTranslations } from 'next-intl/server';
import { AuthProvider } from './lib/auth-context';
import { SiteHeader } from './components/site-header';
import { SiteFooter } from './components/site-footer';
import './globals.css'

// Inter is the brand typeface across the whole reskin (display + body).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
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
    <html lang={locale} className={inter.variable}>
      <body className="bg-cream-50 text-forest-700 selection:bg-brand-200 min-h-screen overflow-x-hidden font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
          <AuthProvider>
            <a
              href="#main-content"
              className="focus:bg-brand-600 focus:text-cream-50 sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-md"
            >
              {t('skipToContent')}
            </a>
            <SiteHeader />
            {/* The only <main> on every page; pages render sections inside it. */}
            <main id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <SiteFooter />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
