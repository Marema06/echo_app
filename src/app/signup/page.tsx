'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    // If no session → email confirmation required
    if (!data.session) {
      setEmailSent(true);
      setLoading(false);
      return;
    }

    // Session present → email confirmation disabled, proceed directly
    router.push(next.startsWith('/') ? next : '/dashboard');
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

          {emailSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-serif text-2xl">Vérifiez votre email</h1>
              <p className="text-ink-500 text-sm leading-relaxed">
                Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                Cliquez dessus pour activer votre compte.
              </p>
              <p className="text-xs text-ink-400">
                Pensez à vérifier vos spams si vous ne le trouvez pas.
              </p>
              <Link href="/login" className="inline-block text-sm text-ink-900 dark:text-ink-200 hover:underline mt-2">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div>
                <p className="uppercase tracking-[0.2em] text-xs text-ink-400">Inscription</p>
                <h1 className="font-serif text-2xl mt-1">Commencez votre journal.</h1>
                <p className="text-ink-500 text-sm mt-2">
                  Créez votre compte pour transformer vos émotions en art.
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
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-3 text-sm
                               focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5
                               transition-all"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-ink-600">Confirmer le mot de passe</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Même mot de passe"
                    required
                    minLength={8}
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
                  {loading ? <Spinner size="sm" /> : 'Créer mon compte'}
                </button>
              </form>

              <p className="text-center text-sm text-ink-500">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-ink-900 dark:text-ink-200 hover:underline">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
