'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EchoLogo } from '@/components/ui/echo-logo';
import { ArrowRight, Mic, Sparkles, Grid3X3 } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    eyebrow: 'Bienvenue',
    title: 'Votre journal\némotionnel.',
    subtitle:
      'ECHO transforme ce que vous ressentez en une oeuvre visuelle unique — chaque jour, une nouvelle tuile dans votre mosaïque personnelle.',
    visual: 'welcome',
  },
  {
    id: 2,
    eyebrow: 'Comment ça marche',
    title: 'Trois étapes,\nune tuile.',
    subtitle: null,
    visual: 'steps',
  },
  {
    id: 3,
    eyebrow: 'Prêt ?',
    title: 'Votre première\ntuile vous attend.',
    subtitle:
      'Écrivez librement ce que vous ressentez aujourd\'hui. Pas besoin de chercher les bons mots — l\'IA s\'occupe du reste.',
    visual: 'cta',
  },
];

const HOW_STEPS = [
  {
    icon: Mic,
    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    title: 'Exprimez-vous',
    desc: 'Écrivez ou dictez librement votre ressenti. Texte libre, sans contrainte.',
  },
  {
    icon: Sparkles,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    title: "L'IA analyse",
    desc: 'Détection de 10 émotions, intensité et valence émotionnelle.',
  },
  {
    icon: Grid3X3,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    title: 'La tuile naît',
    desc: 'Une visualisation unique est créée et ajoutée à votre mosaïque.',
  },
];

const DEMO_COLORS = [
  ['#FFD700', '#FFA500'],
  ['#4169E1', '#6A5ACD'],
  ['#98FB98', '#87CEEB'],
  ['#DDA0DD', '#9370DB'],
  ['#DC143C', '#FF4500'],
  ['#A9A9A9', '#696969'],
];

function MosaicPreview() {
  return (
    <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
      {DEMO_COLORS.map(([c1, c2], i) => (
        <div
          key={i}
          className="aspect-square rounded-xl shadow-soft"
          style={{
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            opacity: i === 5 ? 0.3 : 1,
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      router.push('/create');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden">

      {/* Decorative blur */}
      <div
        className="absolute top-[-150px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.6), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-60px] w-[300px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.5), transparent 70%)' }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2 self-start relative z-10">
        <EchoLogo size={28} />
        <span className="font-serif text-xl font-semibold">ECHO.</span>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10 text-center">

        {/* Visual zone */}
        <div className="w-full flex items-center justify-center min-h-[180px]">
          {current.visual === 'welcome' && (
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl shadow-pop flex items-center justify-center bg-ink-900 dark:bg-ink-50"
                style={{ background: 'linear-gradient(135deg, #4169E1, #DDA0DD)' }}>
                <EchoLogo size={48} className="text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl shadow-soft"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }} />
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-xl shadow-soft"
                style={{ background: 'linear-gradient(135deg, #98FB98, #87CEEB)' }} />
            </div>
          )}

          {current.visual === 'steps' && (
            <div className="w-full flex flex-col gap-3">
              {HOW_STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-4 bg-surface-glass backdrop-blur-sm rounded-2xl px-4 py-3 shadow-soft border border-ink-900/[0.06] text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-ink-900 dark:text-ink-100">{s.title}</p>
                    <p className="text-xs text-ink-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {current.visual === 'cta' && <MosaicPreview />}
        </div>

        {/* Text */}
        <div className="space-y-3">
          <p className="uppercase tracking-[0.2em] text-xs text-ink-400">{current.eyebrow}</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight whitespace-pre-line">
            {current.title}
          </h1>
          {current.subtitle && (
            <p className="text-ink-500 text-sm leading-relaxed max-w-[320px] mx-auto">
              {current.subtitle}
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                     rounded-full py-3.5 px-7 text-base font-medium
                     hover:-translate-y-0.5 transition-all shadow-pop"
        >
          {isLast ? (
            <>Créer ma première tuile <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Suivant <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        {isLast && (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-ink-400 hover:text-ink-600 transition-colors"
          >
            Passer pour l&apos;instant
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 relative z-10">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`rounded-full transition-all ${
              i === step
                ? 'w-6 h-2 bg-ink-900 dark:bg-ink-100'
                : 'w-2 h-2 bg-ink-300 dark:bg-ink-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
