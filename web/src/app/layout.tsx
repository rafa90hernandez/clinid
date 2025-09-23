// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClinID',
  description: 'Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
