import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <EchoLogo size={48} />
      <h1 className="font-serif text-6xl text-ink-900 mt-6 mb-2">404</h1>
      <p className="text-ink-500 text-base mb-1">Page introuvable</p>
      <p className="text-ink-400 text-sm mb-8">Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-ink-900 text-white rounded-full text-sm font-medium hover:-translate-y-0.5 transition-all shadow-pop"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
