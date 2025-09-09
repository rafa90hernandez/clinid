import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-6 space-x-4">
      <Link href="/register" className="underline">Criar conta</Link>
      <Link href="/login" className="underline">Entrar</Link>
    </main>
  );
}
