// web/src/app/qr/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { apiGetAuth, apiPostAuth, apiPost, apiPutAuth } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import Image from 'next/image';

async function revogarLink() {
  if (!link) return;
  try {
    const token = localStorage.getItem('token') ?? '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/me/public-link/${link.id}/revoke`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(await res.text());
    setLink({ ...link, status: 'revoked' });
  } catch (e) {
    alert('Falha ao revogar link');
  }
}

type Link = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
};
type PublicViewResponse = {
  first_name: string;
  last_name: string;
  updated_at: string;
};
type SetPinResponse = { userId: string; updatedAt: string };

export default function QRPage() {
  useRequireAuth();

  const [link, setLink] = useState<Link | null>(null);

  // formulário de PIN
  const [pin, setPin] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  // validação de PIN (teste)
  const [validating, setValidating] = useState(false);
  const [valMsg, setValMsg] = useState<string | null>(null);

  const publicBase =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    (async () => {
      try {
        // tenta buscar link ativo; se não houver, cria
        let current: Link | null = null;
        try {
          current = await apiGetAuth<Link>('/me/public-link');
        } catch {
          current = await apiPostAuth<Link>('/me/public-link', {});
        }
        setLink(current);
      } catch (e) {
        console.error(e);
        setValMsg('Não foi possível obter/gerar o link público.');
      }
    })();
  }, []);

  const url = link ? `${publicBase}/p/${link.slug}` : '';

  async function definirPin() {
    setPinMsg(null);
    setSavingPin(true);
    try {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setPinMsg('PIN deve ter 6 dígitos numéricos.');
        return;
      }
      if (!loginPassword) {
        setPinMsg('Informe sua senha de login para confirmar.');
        return;
      }
      const res = await apiPutAuth<SetPinResponse>('/me/pin', {
        pin,
        confirmLoginPassword: loginPassword,
      });
      if (res?.userId) {
        setPinMsg('PIN definido/atualizado com sucesso ✅');
      } else {
        setPinMsg('Não foi possível definir o PIN.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao definir PIN';
      setPinMsg(msg);
    } finally {
      setSavingPin(false);
    }
  }

  async function validarPin() {
    if (!link) return;
    setValMsg(null);
    setValidating(true);
    try {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setValMsg('PIN deve ter 6 dígitos.');
        return;
      }
      await apiPost<PublicViewResponse>('/public/view', {
        slug: link.slug,
        pin,
      });
      setValMsg('PIN válido ✅');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PIN inválido';
      setValMsg(`PIN inválido ❌ — ${msg}`);
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="w-[380px] rounded-2xl bg-white shadow p-5 space-y-4 print:shadow-none">
        <div className="flex items-center gap-3">
          <Image src="/Logo.png" alt="ClinID" width={120} height={40} priority />
          <div className="ml-auto text-xs text-slate-500">Cartão de acesso</div>
        </div>

        {link ? (
          <>
            {/* QR + URL */}
            <div className="flex flex-col items-center">
              <QRCodeCanvas value={url} size={200} includeMargin />
              <div className="mt-2 text-xs text-slate-500 break-all">{url}</div>
            </div>

            {/* Definir / Atualizar PIN */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-slate-800">
                Definir/Atualizar PIN público
              </h2>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="PIN (6 dígitos)"
                className="w-full border rounded-lg px-3 py-2 text-center tracking-widest"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Sua senha de login para confirmar"
                className="w-full border rounded-lg px-3 py-2"
              />
              <button
                onClick={definirPin}
                disabled={savingPin || pin.length !== 6 || !loginPassword}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2 disabled:opacity-50"
              >
                {savingPin ? 'Salvando…' : 'Definir/Atualizar PIN'}
              </button>
              {pinMsg && (
                <div
                  className={`text-sm ${pinMsg.includes('sucesso') ? 'text-emerald-700' : 'text-red-700'
                    }`}
                >
                  {pinMsg}
                </div>
              )}
            </div>

            {/* Validar PIN (teste rápido) */}
            <div className="space-y-2 pt-2">
              <h2 className="text-sm font-medium text-slate-800">Testar PIN</h2>
              <div className="flex gap-2">
                <button
                  onClick={validarPin}
                  disabled={validating || pin.length !== 6}
                  className="flex-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white py-2 disabled:opacity-50"
                >
                  {validating ? 'Validando…' : 'Validar PIN'}
                </button>
                <a
                  href={url}
                  target="_blank"
                  className="flex-1 text-center rounded-lg bg-slate-700 hover:bg-slate-800 text-white py-2"
                >
                  Abrir página pública
                </a>
              </div>
              {valMsg && (
                <div
                  className={`text-sm ${valMsg.includes('válido') ? 'text-emerald-700' : 'text-red-700'
                    }`}
                >
                  {valMsg}
                </div>
              )}
              <button
                onClick={() => window.print()}
                className="w-full mt-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white py-2"
              >
                Imprimir cartão
              </button>
              <button
                onClick={revogarLink}
                className="w-full mt-2 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2"
              >
                Revogar link público
              </button>

            </div>
          </>
        ) : (
          <div className="text-center text-slate-500">Gerando link...</div>
        )}
      </div>
    </div>
  );
}
