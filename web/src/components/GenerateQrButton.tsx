'use client';

import Link from 'next/link';

export default function GenerateQrButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/qr"
      className={
        `inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-white ` +
        `hover:opacity-90 active:opacity-80 transition ` +
        className
      }
      aria-label="Gerar QR Code"
    >
      <span aria-hidden>🔳</span>
      <span>Gerar QR Code</span>
    </Link>
  );
}