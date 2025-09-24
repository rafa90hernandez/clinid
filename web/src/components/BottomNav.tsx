'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/history', label: 'Histórico', icon: '❤️' },
  { href: '/profile', label: 'Cadastro', icon: '🧾' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // esconder na página pública e em impressão
  const hide =
    pathname?.startsWith('/p/') || pathname === '/p' || pathname?.startsWith('/public') || false;
  if (hide) return null;

  return (
    <nav className="print:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-t">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center py-2 text-sm ${
                  active ? 'text-sky-600 font-medium' : 'text-slate-600'
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="mt-1">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
