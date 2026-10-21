import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Storefront",
  description: "Welcome to our online storefront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}