'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-600 hover:text-ink-900 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="bg-surface-glass backdrop-blur-sm rounded-4xl p-8 shadow-soft space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <EchoLogo size={32} />
            <span className="font-serif text-2xl font-semibold">ECHO.</span>
          </div>

          <div>
            <p className="uppercase tracking-[0.2em] text-xs text-ink-400">Connexion</p>
            <h1 className="font-serif text-2xl mt-1">Retrouvez votre espace.</h1>
            <p className="text-ink-500 text-sm mt-2">
              Connectez-vous pour retrouver votre mosaïque émotionnelle.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-3 text-sm
                           focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5
                           transition-all"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink-600">Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-3 text-sm
                           focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5
                           transition-all"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                         rounded-full py-3 px-6 text-sm font-medium
                         hover:-translate-y-0.5 transition-all shadow-pop
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? <Spinner size="sm" /> : 'Se connecter'}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-ink-500 hover:text-ink-900 transition-colors">
              Mot de passe oublié
            </Link>
            <Link href="/signup" className="text-ink-500 hover:text-ink-900 transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
