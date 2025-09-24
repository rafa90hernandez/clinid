// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ClinID',
  description: 'Dashboard',
  // opcional: ajuda alguns UAs a ajustar componentes nativos
  metadataBase: new URL('http://localhost:3000'),
  other: { 'color-scheme': 'light' },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-slate-50 text-slate-900 antialiased"
      >
        {children}
      </body>
    </html>
  );
}
