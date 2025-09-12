'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { apiGetAuth, apiPostAuth } from '@/lib/api';
import Image from 'next/image';

type Link = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
};

export default function QRPage() {
  const [link, setLink] = useState<Link | null>(null);
  const [pin, setPin] = useState('');

  const publicBase =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    (async () => {
      try {
        // tenta buscar link ativo
        let current: Link | null = null;
        try {
          current = await apiGetAuth<Link>('/me/public-link');
        } catch {
          // se não existir, cria um novo
          current = await apiPostAuth<Link>('/me/public-link', {});
        }
        setLink(current);
      } catch (e) {
        console.error(e);
        alert('Não foi possível obter/gerar o link público.');
      }
    })();
  }, []);

  const url = link ? `${publicBase}/p/${link.slug}` : '';

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="w-[360px] rounded-2xl bg-white shadow p-5 space-y-4 print:shadow-none">
        <div className="flex items-center gap-3">
          <Image src="/Logo.png" alt="ClinID" width={120} height={40} priority />
          <div className="ml-auto text-xs text-slate-500">Cartão de acesso</div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="border rounded-xl p-3 bg-white">
            <QRCodeCanvas value={url || '...'} size={180} />
          </div>

          <div className="text-center text-sm">
            <div className="font-medium">Senha pública (PIN)</div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="ex.: 123456"
              maxLength={6}
              className="mt-1 w-40 text-center border rounded p-1"
            />
          </div>

          <div className="w-full text-xs text-slate-600">
            {link ? (
              <>
                <div>
                  URL pública:{' '}
                  <a className="text-sky-700 underline" href={url} target="_blank">
                    {url}
                  </a>
                </div>
                <div>Slug: {link.slug}</div>
              </>
            ) : (
              <div>Gerando link…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
