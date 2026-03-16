'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <EchoLogo size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl">Une erreur est survenue</h1>
          <p className="text-ink-500 text-sm">
            Quelque chose s&apos;est mal passé. Vos données sont en sécurité.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-ink-900 text-white rounded-full py-2.5 px-6 text-sm font-medium hover:-translate-y-0.5 transition-all shadow-pop"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-ink-900/[0.12] rounded-full py-2.5 px-6 text-sm text-ink-700 hover:bg-ink-50 transition-all"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
