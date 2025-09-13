import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClinID',
  description: 'Compartilhamento de informações clínicas com PIN.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
