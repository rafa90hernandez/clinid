import type { Metadata } from 'next';
import './globals.css';

import { Geist, Geist_Mono } from 'next/font/google';
import BottomNav from '@/components/BottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-brand-50 text-gray-900">
        <div className="pb-16">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}


const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'ClinID',
  description: 'Soluções emergenciais – ClinID',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-brand-50 text-gray-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
