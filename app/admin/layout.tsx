import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bio Bloom — Admin Console',
  description: 'Internal admin dashboard for Bio Bloom operations.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 font-sans text-forest-700 antialiased">
        {children}
      </body>
    </html>
  );
}
