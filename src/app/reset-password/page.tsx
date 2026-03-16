'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-ink-600 hover:text-ink-900 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        <div className="bg-surface-glass backdrop-blur-sm rounded-4xl p-8 shadow-soft space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <EchoLogo size={32} />
            <span className="font-serif text-2xl font-semibold">ECHO.</span>
          </div>

          <div>
            <p className="uppercase tracking-[0.2em] text-xs text-ink-400">Nouveau mot de passe</p>
            <h1 className="font-serif text-2xl mt-1">Définissez votre accès.</h1>
            <p className="text-ink-500 text-sm mt-2">
              Choisissez un nouveau mot de passe sécurisé.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink-600">Nouveau mot de passe</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-3 pr-11 text-sm
                             focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink-600">Confirmer le mot de passe</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-3 text-sm
                           focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5 transition-all"
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
              {loading ? <Spinner size="sm" /> : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
