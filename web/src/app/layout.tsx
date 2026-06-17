// web/src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

export const metadata: Metadata = {
  title: 'ClinID',
  description: 'Emergency medical ID app',
  metadataBase: new URL('http://localhost:3000'),
  other: { 'color-scheme': 'light' },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-slate-50 text-slate-900 antialiased"
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}