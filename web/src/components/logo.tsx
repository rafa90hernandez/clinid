'use client';
import Image from 'next/image';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="ClinID — Soluções emergenciais"
        width={180} // ajuste se quiser maior/menor
        height={82}
        priority
        className="drop-shadow-sm"
      />
    </div>
  );
}
