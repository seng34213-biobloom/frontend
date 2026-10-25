import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { AuthProvider } from './lib/auth-context';
import { SiteHeader } from './components/site-header';
import { SiteFooter } from './components/site-footer';
import './globals.css';

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
    title: `${t('brand')} — ${t('tagline')}`,
    description:
      'Artisanal jams, chilli sauces and gift boxes made in Kalutara, Sri Lanka.',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-cream-50 font-sans text-forest-700 antialiased selection:bg-brand-200">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream-50 focus:shadow-md"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
