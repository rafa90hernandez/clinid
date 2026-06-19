'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: t('home'), icon: '⌂' },
    { href: '/history', label: t('history'), icon: '♡' },
    { href: '/qr/print', label: t('qrCode'), icon: '▣' },
    { href: '/profile', label: t('profile'), icon: '◴' },
  ];

  const hide =
    pathname?.startsWith('/p/') ||
    pathname === '/p' ||
    pathname?.startsWith('/public') ||
    false;

  if (hide) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 print:hidden">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-2 shadow-2xl shadow-slate-400/25 backdrop-blur-xl">
          <ul className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => {
              const active =
                pathname === tab.href ||
                (tab.href !== '/' && pathname?.startsWith(tab.href));

              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-gradient-to-br from-[#7CA7FF] to-[#38BDF8] text-white shadow-lg shadow-blue-300/40'
                        : 'text-slate-500 hover:bg-[#E6EBFF] hover:text-[#5277C8]'
                    }`}
                  >
                    <span className="text-lg leading-none">{tab.icon}</span>
                    <span className="mt-1 leading-none">{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
    </nav>
  );
}