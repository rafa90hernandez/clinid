import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="bg-white rounded-xl2 shadow-soft p-6 space-x-4">
        <Link href="/register" className="underline text-brand-700">
          Criar conta
        </Link>
        <Link href="/login" className="underline text-brand-700">
          Entrar
        </Link>
      </div>
    </main>
  );
}
