'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Plus } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl">Impossible de charger cette page</h2>
        <p className="text-ink-500 text-sm max-w-sm mx-auto">
          Une erreur inattendue s&apos;est produite. Vos entrées sont en sécurité.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-ink-900 text-white rounded-full py-2.5 px-5 text-sm font-medium hover:-translate-y-0.5 transition-all shadow-pop"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 border border-ink-900/[0.12] rounded-full py-2.5 px-5 text-sm text-ink-700 hover:bg-ink-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvelle entrée
        </Link>
      </div>
    </div>
  );
}
