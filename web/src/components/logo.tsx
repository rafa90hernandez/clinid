'use client';
import Image from 'next/image';
import logoPng from '@/../public/logo.png';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl ${className}`}>
      <Image
        src={logoPng}
        alt="ClinID — Soluções emergenciais"
        width={250}
        height={114}
        priority
      />
    </div>
  );
}
