'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { CheckCircle2, Sparkles, ChevronLeft, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PLANS = {
  premium: {
    label: 'Premium',
    price: '8 € / mois',
    color: 'from-ink-900/[0.96] to-ink-800/[0.96]',
    textColor: 'text-white',
    features: [
      'Entrées illimitées',
      'Dictée vocale & transcription',
      '6 styles visuels avancés',
      'Rétrospective mensuelle IA',
      'Export HD de vos tuiles',
    ],
  },
  studio: {
    label: 'Studio',
    price: '24 € / mois',
    color: 'from-violet-900/[0.96] to-violet-800/[0.96]',
    textColor: 'text-white',
    features: [
      'Tout Premium inclus',
      'Export poster & livre',
      'Rétrospective annuelle IA',
      'Archivage haute définition',
      'Assistance prioritaire',
    ],
  },
};

export default function UpgradePage() {
  const searchParams = useSearchParams();
  const plan = (searchParams.get('plan') ?? 'premium') as 'premium' | 'studio';
  const selectedPlan = PLANS[plan] ?? PLANS.premium;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: enregistrer l'email dans la DB pour notifier au lancement
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ink-600 hover:text-ink-900 text-sm mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="space-y-4">
          {/* Plan card */}
          <div className={`bg-gradient-to-br ${selectedPlan.color} rounded-[22px] p-6 text-white space-y-4`}>
            <div className="flex items-center gap-3">
              <EchoLogo size={28} />
              <span className="font-serif text-xl font-semibold">ECHO.</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">{selectedPlan.label}</p>
              <p className="font-serif text-3xl mt-0.5">{selectedPlan.price}</p>
            </div>
            <ul className="space-y-2">
              {selectedPlan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Coming soon notice */}
          <div className="bg-surface-glass backdrop-blur-sm rounded-[22px] p-6 shadow-soft border border-ink-900/[0.08] space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-semibold text-ink-900 dark:text-ink-100">Paiement bientôt disponible</h2>
                <p className="text-sm text-ink-500 mt-1 leading-relaxed">
                  L&apos;intégration du paiement est en cours de développement. Laissez votre email pour être notifié en premier au lancement.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Vous serez notifié au lancement du plan {selectedPlan.label}.
              </div>
            ) : (
              <form onSubmit={handleNotify} className="space-y-3">
                <input
                  type="email"
                  value={userEmail || email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  readOnly={!!userEmail}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-surface px-4 py-2.5 text-sm
                             focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5 transition-all
                             read-only:opacity-70 read-only:cursor-not-allowed"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                             rounded-full py-2.5 px-5 text-sm font-medium hover:-translate-y-0.5 transition-all shadow-pop"
                >
                  <Bell className="w-4 h-4" />
                  Me notifier au lancement
                </button>
              </form>
            )}

            <p className="text-center text-xs text-ink-400">
              En attendant, profitez de toutes les fonctionnalités gratuites.{' '}
              <Link href="/dashboard" className="underline hover:text-ink-700 transition-colors">
                Aller au tableau de bord
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
